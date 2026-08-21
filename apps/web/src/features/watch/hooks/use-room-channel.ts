'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type {
  ChatMessage,
  MessageReaction,
  Participant,
  PlaybackAnchor,
  QueueBroadcastEvent,
  ReactionEvent,
  Room,
  RoomBroadcastEvent,
  RoomRealtimeEvents,
} from '../types';
import { watchKeys } from '../query-keys';
import { getStructuralSignature } from '../sync-math';
import {
  classifyRoomUpdate,
  getPlaybackSignature,
  normalizeParticipants,
  queueBroadcastNotice,
} from '../room-channel-model';
import { useTelemetryRef, type Telemetry } from '@/shared/lib/observability';

type Cell<T> = { current: T };
type HandlerCell<T> = Cell<Set<(value: T) => void>>;
type ChannelConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface InboundContext {
  channel: RealtimeChannel;
  roomId: string;
  queryClient: QueryClient;
  structuralSignature: Cell<string>;
  playbackSignature: Cell<string>;
  anchorHandlers: HandlerCell<PlaybackAnchor>;
  chatHandlers: HandlerCell<ChatMessage>;
  reactionHandlers: HandlerCell<ReactionEvent>;
  messageReactionHandlers: HandlerCell<MessageReaction>;
  setParticipants: (participants: Participant[]) => void;
}

interface SubscriptionContext {
  channel: RealtimeChannel;
  roomId: string;
  userId: string;
  queryClient: QueryClient;
  telemetry: Cell<Telemetry>;
  isHost: Cell<boolean>;
  joinedAt: Cell<number>;
  wasDisconnected: Cell<boolean>;
  setChannelStatus: (status: ChannelConnectionStatus) => void;
}

function emitIfPresent<T>(handlers: Set<(value: T) => void>, value: T | null | undefined) {
  if (value != null) handlers.forEach((handler) => handler(value));
}

function applyRoomSnapshot(nextRoom: Room | null | undefined, context: InboundContext) {
  if (!nextRoom) return;

  const decision = classifyRoomUpdate(
    context.structuralSignature.current,
    context.playbackSignature.current,
    nextRoom,
  );
  context.structuralSignature.current = decision.structuralSignature;
  context.playbackSignature.current = decision.playbackSignature;

  if (decision.invalidateRoom) {
    void context.queryClient.invalidateQueries({ queryKey: watchKeys.room(context.roomId) });
  }
  emitIfPresent(context.anchorHandlers.current, decision.anchor);
}

function applyQueueBroadcast(event: QueueBroadcastEvent, context: InboundContext) {
  void context.queryClient.invalidateQueries({ queryKey: watchKeys.queue(context.roomId) });
  const notice = queueBroadcastNotice(event);
  if (notice) toast.info(notice);
}

function registerInboundListeners(context: InboundContext) {
  const { channel } = context;

  // Authoritative room snapshots remain the source of truth. The pure model
  // decides whether the update changes structure, playback, or both; this
  // transport layer owns only cache invalidation and event delivery.
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'watch_rooms',
      filter: `id=eq.${context.roomId}`,
    },
    (payload: { new: Room }) => applyRoomSnapshot(payload.new, context),
  );

  channel.on('broadcast', { event: 'room' }, () => {
    void context.queryClient.invalidateQueries({ queryKey: watchKeys.room(context.roomId) });
  });

  channel.on('broadcast', { event: 'queue' }, (message: { payload: QueueBroadcastEvent }) => {
    applyQueueBroadcast(message.payload, context);
  });

  // Low-latency host anchor fan-out (ADR-0011). Versioned anchors arrive here
  // far sooner than the authoritative postgres_changes snapshot; both feed the
  // same handlers and dedupe via `shouldAcceptPlaybackAnchor`.
  channel.on('broadcast', { event: 'anchor' }, (message: { payload: PlaybackAnchor }) => {
    emitIfPresent(context.anchorHandlers.current, message.payload);
  });
  channel.on('broadcast', { event: 'chat' }, (message: { payload: ChatMessage }) => {
    emitIfPresent(context.chatHandlers.current, message.payload);
  });
  channel.on('broadcast', { event: 'reaction' }, (message: { payload: ReactionEvent }) => {
    emitIfPresent(context.reactionHandlers.current, message.payload);
  });
  channel.on(
    'broadcast',
    { event: 'message-reaction' },
    (message: { payload: MessageReaction }) => {
      emitIfPresent(context.messageReactionHandlers.current, message.payload);
    },
  );

  channel.on('presence', { event: 'sync' }, () => {
    context.setParticipants(normalizeParticipants(channel.presenceState()));
  });
}

async function handleSubscribed(context: SubscriptionContext) {
  context.setChannelStatus('connected');
  if (context.wasDisconnected.current) {
    context.wasDisconnected.current = false;
    context.telemetry.current.event('channel.reconnect', { roomId: context.roomId });
    void context.queryClient.invalidateQueries({ queryKey: watchKeys.room(context.roomId) });
    void context.queryClient.invalidateQueries({ queryKey: watchKeys.queue(context.roomId) });
  }

  await context.channel.track({
    userId: context.userId,
    isHost: context.isHost.current,
    joinedAt: context.joinedAt.current,
  });
}

function handleDisconnected(status: string, context: SubscriptionContext) {
  if (!context.wasDisconnected.current) {
    context.telemetry.current.event('channel.disconnect', { roomId: context.roomId, status });
  }
  context.wasDisconnected.current = true;
  context.setChannelStatus('disconnected');
}

const DISCONNECTED_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);

async function handleSubscriptionStatus(status: string, context: SubscriptionContext) {
  if (status === 'SUBSCRIBED') {
    await handleSubscribed(context);
    return;
  }
  if (DISCONNECTED_STATUSES.has(status)) handleDisconnected(status, context);
}

function trackPresenceIfJoined(
  channel: RealtimeChannel | null,
  userId: string,
  isHost: boolean,
  joinedAt: number,
) {
  if (channel?.state !== 'joined') return;
  void channel.track({ userId, isHost, joinedAt });
}

function sendBroadcast<T>(channel: RealtimeChannel | null, event: string, payload: T) {
  if (channel?.state !== 'joined') return;
  channel.send({ type: 'broadcast', event, payload });
}

export function useRoomChannel(room: Room, userId: string, isHost: boolean) {
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [channelStatus, setChannelStatus] = useState<ChannelConnectionStatus>('connecting');
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
    return () => anchorHandlersRef.current.delete(handler);
  }, []);
  const onChat = useCallback((handler: (message: ChatMessage) => void) => {
    chatHandlersRef.current.add(handler);
    return () => chatHandlersRef.current.delete(handler);
  }, []);
  const onReaction = useCallback((handler: (reaction: ReactionEvent) => void) => {
    reactionHandlersRef.current.add(handler);
    return () => reactionHandlersRef.current.delete(handler);
  }, []);
  const onMessageReaction = useCallback((handler: (reaction: MessageReaction) => void) => {
    messageReactionHandlersRef.current.add(handler);
    return () => messageReactionHandlersRef.current.delete(handler);
  }, []);

  const events: RoomRealtimeEvents = { onAnchor, onChat, onReaction, onMessageReaction };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const activeChannel = supabase.channel(`room:${room.id}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = activeChannel;

    registerInboundListeners({
      channel: activeChannel,
      roomId: room.id,
      queryClient,
      structuralSignature: structuralSignatureRef,
      playbackSignature: playbackSignatureRef,
      anchorHandlers: anchorHandlersRef,
      chatHandlers: chatHandlersRef,
      reactionHandlers: reactionHandlersRef,
      messageReactionHandlers: messageReactionHandlersRef,
      setParticipants,
    });

    activeChannel.subscribe((status) => {
      void handleSubscriptionStatus(status, {
        channel: activeChannel,
        roomId: room.id,
        userId,
        queryClient,
        telemetry: telemetryRef,
        isHost: isHostRef,
        joinedAt: joinedAtRef,
        wasDisconnected: wasDisconnectedRef,
        setChannelStatus,
      });
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
    trackPresenceIfJoined(channelRef.current, userId, isHost, joinedAtRef.current);
  }, [isHost, userId]);

  const broadcastQueueEvent = useCallback((event: QueueBroadcastEvent) => {
    sendBroadcast(channelRef.current, 'queue', event);
  }, []);
  const broadcastRoomEvent = useCallback((event: RoomBroadcastEvent) => {
    sendBroadcast(channelRef.current, 'room', event);
  }, []);
  const broadcastAnchor = useCallback((anchor: PlaybackAnchor) => {
    sendBroadcast(channelRef.current, 'anchor', anchor);
  }, []);
  const broadcastChat = useCallback((message: ChatMessage) => {
    sendBroadcast(channelRef.current, 'chat', message);
  }, []);
  const broadcastReaction = useCallback((reaction: ReactionEvent) => {
    sendBroadcast(channelRef.current, 'reaction', reaction);
  }, []);
  const broadcastMessageReaction = useCallback((reaction: MessageReaction) => {
    sendBroadcast(channelRef.current, 'message-reaction', reaction);
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
