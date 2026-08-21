'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type {
  PlaybackAnchor,
  Participant,
  Room,
  QueueBroadcastEvent,
  RoomBroadcastEvent,
  RoomRealtimeEvents,
  ChatMessage,
  ReactionEvent,
  MessageReaction,
} from '../types';
import { watchKeys } from '../query-keys';
import { getStructuralSignature } from '../sync-math';
import {
  classifyRoomUpdate,
  getPlaybackSignature,
  normalizeParticipants,
  queueBroadcastNotice,
} from '../room-channel-model';
import { useTelemetryRef } from '@/shared/lib/observability';

export function useRoomChannel(room: Room, userId: string, isHost: boolean) {
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting',
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const structuralSignatureRef = useRef(getStructuralSignature(room));
  const playbackSignatureRef = useRef(getPlaybackSignature(room));
  const anchorHandlersRef = useRef(new Set<(anchor: PlaybackAnchor) => void>());
  const chatHandlersRef = useRef(new Set<(message: ChatMessage) => void>());
  const reactionHandlersRef = useRef(new Set<(reaction: ReactionEvent) => void>());
  const messageReactionHandlersRef = useRef(new Set<(reaction: MessageReaction) => void>());

  const isHostRef = useRef(isHost);
  const joinedAtRef = useRef(0);
  const wasDisconnectedRef = useRef(false);
  const telemetryRef = useTelemetryRef();
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    structuralSignatureRef.current = getStructuralSignature(room);
    playbackSignatureRef.current = getPlaybackSignature(room);
  }, [room]);

  useEffect(() => {
    joinedAtRef.current = Date.now();
  }, []);

  const onAnchor = useCallback((handler: (anchor: PlaybackAnchor) => void) => {
    anchorHandlersRef.current.add(handler);
    return () => {
      anchorHandlersRef.current.delete(handler);
    };
  }, []);

  const onChat = useCallback((handler: (message: ChatMessage) => void) => {
    chatHandlersRef.current.add(handler);
    return () => {
      chatHandlersRef.current.delete(handler);
    };
  }, []);

  const onReaction = useCallback((handler: (reaction: ReactionEvent) => void) => {
    reactionHandlersRef.current.add(handler);
    return () => {
      reactionHandlersRef.current.delete(handler);
    };
  }, []);

  const onMessageReaction = useCallback((handler: (reaction: MessageReaction) => void) => {
    messageReactionHandlersRef.current.add(handler);
    return () => {
      messageReactionHandlersRef.current.delete(handler);
    };
  }, []);

  const events: RoomRealtimeEvents = { onAnchor, onChat, onReaction, onMessageReaction };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const activeChannel = supabase.channel(`room:${room.id}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = activeChannel;

    // Authoritative room snapshots remain the source of truth. The pure model
    // decides whether the update changes structure, playback, or both; this
    // effect owns only cache invalidation and event delivery.
    activeChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'watch_rooms',
        filter: `id=eq.${room.id}`,
      },
      (payload: { new: Room }) => {
        const nextRoom = payload.new;
        if (!nextRoom) return;

        const decision = classifyRoomUpdate(
          structuralSignatureRef.current,
          playbackSignatureRef.current,
          nextRoom,
        );
        structuralSignatureRef.current = decision.structuralSignature;
        playbackSignatureRef.current = decision.playbackSignature;

        if (decision.invalidateRoom) {
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
        }
        const anchor = decision.anchor;
        if (anchor) {
          anchorHandlersRef.current.forEach((handler) => handler(anchor));
        }
      },
    );

    activeChannel.on('broadcast', { event: 'room' }, () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
    });

    activeChannel.on('broadcast', { event: 'queue' }, (msg: { payload: QueueBroadcastEvent }) => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
      const notice = queueBroadcastNotice(msg.payload);
      if (notice) toast.info(notice);
    });

    // Low-latency host anchor fan-out (ADR-0011). Versioned anchors arrive here
    // far sooner than the authoritative postgres_changes snapshot; both feed the
    // same handlers and dedupe via `shouldAcceptPlaybackAnchor`.
    activeChannel.on('broadcast', { event: 'anchor' }, (p: { payload: PlaybackAnchor }) => {
      if (p.payload) anchorHandlersRef.current.forEach((handler) => handler(p.payload));
    });

    activeChannel.on('broadcast', { event: 'chat' }, (p: { payload: ChatMessage }) => {
      if (p.payload) chatHandlersRef.current.forEach((handler) => handler(p.payload));
    });

    activeChannel.on('broadcast', { event: 'reaction' }, (p: { payload: ReactionEvent }) => {
      if (p.payload) reactionHandlersRef.current.forEach((handler) => handler(p.payload));
    });

    activeChannel.on(
      'broadcast',
      { event: 'message-reaction' },
      (p: { payload: MessageReaction }) => {
        if (p.payload) messageReactionHandlersRef.current.forEach((handler) => handler(p.payload));
      },
    );

    activeChannel.on('presence', { event: 'sync' }, () => {
      setParticipants(normalizeParticipants(activeChannel.presenceState()));
    });

    activeChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setChannelStatus('connected');
        if (wasDisconnectedRef.current) {
          wasDisconnectedRef.current = false;
          telemetryRef.current.event('channel.reconnect', { roomId: room.id });
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
          void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
        }
        await activeChannel.track({
          userId,
          isHost: isHostRef.current,
          joinedAt: joinedAtRef.current,
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (!wasDisconnectedRef.current) {
          telemetryRef.current.event('channel.disconnect', { roomId: room.id, status });
        }
        wasDisconnectedRef.current = true;
        setChannelStatus('disconnected');
      }
    });

    return () => {
      void supabase.removeChannel(activeChannel);
      channelRef.current = null;
    };
    // telemetryRef is a stable ref; listed for exhaustive-deps, does not
    // re-subscribe the channel.
  }, [room.id, userId, queryClient, telemetryRef]);

  // Re-track presence when host role flips WITHOUT tearing down the channel.
  useEffect(() => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      void ch.track({ userId, isHost, joinedAt: joinedAtRef.current });
    }
  }, [isHost, userId]);

  const broadcastQueueEvent = useCallback((event: QueueBroadcastEvent) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'queue',
        payload: event,
      });
    }
  }, []);

  const broadcastRoomEvent = useCallback((event: RoomBroadcastEvent) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'room',
        payload: event,
      });
    }
  }, []);

  const broadcastAnchor = useCallback((anchor: PlaybackAnchor) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'anchor',
        payload: anchor,
      });
    }
  }, []);

  const broadcastChat = useCallback((message: ChatMessage) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'chat',
        payload: message,
      });
    }
  }, []);

  const broadcastReaction = useCallback((reaction: ReactionEvent) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'reaction',
        payload: reaction,
      });
    }
  }, []);

  const broadcastMessageReaction = useCallback((reaction: MessageReaction) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'message-reaction',
        payload: reaction,
      });
    }
  }, []);

  return {
    participants,
    events,
    broadcastQueueEvent,
    broadcastRoomEvent,
    channelStatus,
    broadcastAnchor,
    broadcastChat,
    broadcastReaction,
    broadcastMessageReaction,
  };
}
