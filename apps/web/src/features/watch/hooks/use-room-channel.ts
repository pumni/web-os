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
  const anchorHandlersRef = useRef(new Set<(anchor: PlaybackAnchor) => void>());
  const chatHandlersRef = useRef(new Set<(message: ChatMessage) => void>());
  const reactionHandlersRef = useRef(new Set<(reaction: ReactionEvent) => void>());

  const isHostRef = useRef(isHost);
  const joinedAtRef = useRef(0);
  const wasDisconnectedRef = useRef(false);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

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

    // 1. Listen to broadcast event (low-latency playback sync)
    activeChannel.on('broadcast', { event: 'playback' }, (payload: { payload: PlaybackAnchor }) => {
      if (payload.payload) {
        anchorHandlersRef.current.forEach((handler) => handler(payload.payload));
      }
    });

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
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
          void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
        }
        await activeChannel.track({
          userId,
          isHost: isHostRef.current,
          joinedAt: joinedAtRef.current,
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        wasDisconnectedRef.current = true;
        setChannelStatus('disconnected');
      }
    });

    return () => {
      void supabase.removeChannel(activeChannel);
      channelRef.current = null;
    };
  }, [room.id, userId, queryClient]);

  // Re-track presence when host role flips WITHOUT tearing down the channel.
  useEffect(() => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      void ch.track({ userId, isHost, joinedAt: joinedAtRef.current });
    }
  }, [isHost, userId]);

  const broadcastAnchor = useCallback((anchor: PlaybackAnchor) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: anchor,
      });
    }
  }, []);

  const broadcastQueueEvent = useCallback((event: QueueBroadcastEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'queue',
        payload: event,
      });
    }
  }, []);

  const broadcastRoomEvent = useCallback((event: RoomBroadcastEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room',
        payload: event,
      });
    }
  }, []);

  const broadcastChat = useCallback((m: ChatMessage) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload: m,
      });
    }
  }, []);

  const broadcastReaction = useCallback((r: ReactionEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: r,
      });
    }
  }, []);

  return {
    participants,
    events,
    broadcastAnchor,
    broadcastQueueEvent,
    broadcastRoomEvent,
    channelStatus,
    broadcastChat,
    broadcastReaction,
  };
}
