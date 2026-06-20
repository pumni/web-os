'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
} from '../types';
import { watchKeys } from '../query-keys';
import { getStructuralSignature } from '../sync-math';
import { useTelemetryRef } from '@/lib/observability';

function getPlaybackSignature(room: Room): string {
  return `${room.is_playing}|${room.anchor_position}|${room.anchor_server_ts}|${room.playback_rate}`;
}

export function useRoomChannel(
  room: Room,
  userId: string,
  isHost: boolean,
) {
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

  const events: RoomRealtimeEvents = useMemo(
    () => ({
      onAnchor,
      onChat,
      onReaction,
    }),
    [onAnchor, onChat, onReaction],
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Create channel
    const activeChannel = supabase.channel(`room:${room.id}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = activeChannel;

    // 1. Listen to authoritative room row changes. Playback state comes from
    // `watch_rooms`, so RLS remains the real host/follower boundary.
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

        const nextSignature = getStructuralSignature(nextRoom);
        if (nextSignature !== structuralSignatureRef.current) {
          structuralSignatureRef.current = nextSignature;
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
        }

        const nextPlaybackSignature = getPlaybackSignature(nextRoom);
        if (nextPlaybackSignature !== playbackSignatureRef.current) {
          playbackSignatureRef.current = nextPlaybackSignature;
          anchorHandlersRef.current.forEach((handler) =>
            handler({
              isPlaying: nextRoom.is_playing,
              anchorPosition: nextRoom.anchor_position,
              anchorServerTs: new Date(nextRoom.anchor_server_ts).getTime(),
              playbackRate: nextRoom.playback_rate,
            }),
          );
        }
      },
    );

    // 2. Listen to broadcast event for structural room changes.
    activeChannel.on('broadcast', { event: 'room' }, () => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
    });

    // 3. Listen to broadcast event for queue changes.
    activeChannel.on('broadcast', { event: 'queue' }, (msg: { payload: QueueBroadcastEvent }) => {
      void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
      const { action, title } = msg.payload ?? {};
      const name = title || 'Không tên';
      if (action === 'add') {
        toast.info(`Video "${name}" đã được thêm vào hàng chờ`);
      } else if (action === 'remove') {
        toast.info(`Video "${name}" đã bị xóa khỏi hàng chờ`);
      } else if (action === 'reorder') {
        toast.info('Thứ tự hàng chờ vừa được cập nhật');
      }
    });

    activeChannel.on('broadcast', { event: 'chat' }, (p: { payload: ChatMessage }) => {
      if (p.payload) chatHandlersRef.current.forEach((handler) => handler(p.payload));
    });

    activeChannel.on('broadcast', { event: 'reaction' }, (p: { payload: ReactionEvent }) => {
      if (p.payload) reactionHandlersRef.current.forEach((handler) => handler(p.payload));
    });

    // 4. Listen to presence events
    activeChannel.on('presence', { event: 'sync' }, () => {
      const state = activeChannel.presenceState();
      const list: Participant[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1] as unknown as {
            presenceRef?: string;
            userId?: string;
            isHost?: boolean;
            joinedAt?: number;
          };
          list.push({
            presenceRef: latest.presenceRef,
            userId: latest.userId || key,
            isHost: !!latest.isHost,
            joinedAt: latest.joinedAt || Date.now(),
          });
        }
      });
      list.sort((a, b) => a.joinedAt - b.joinedAt);
      setParticipants(list);
    });

    // Subscribe to channel
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

  const broadcastChat = useCallback((m: ChatMessage) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'chat',
        payload: m,
      });
    }
  }, []);

  const broadcastReaction = useCallback((r: ReactionEvent) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'reaction',
        payload: r,
      });
    }
  }, []);

  return {
    participants,
    events,
    broadcastQueueEvent,
    broadcastRoomEvent,
    channelStatus,
    broadcastChat,
    broadcastReaction,
  };
}
