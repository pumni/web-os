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
type ChannelConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface EventHandlerSets {
  anchor: Set<(value: PlaybackAnchor) => void>;
  chat: Set<(value: ChatMessage) => void>;
  reaction: Set<(value: ReactionEvent) => void>;
  messageReaction: Set<(value: MessageReaction) => void>;
}

type HandlerRegistry = Cell<EventHandlerSets>;

interface InboundContext {
  channel: RealtimeChannel;
  roomId: string;
  queryClient: QueryClient;
  structuralSignature: Cell<string>;
  playbackSignature: Cell<string>;
  handlers: HandlerRegistry;
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

interface ConnectionContext extends Omit<SubscriptionContext, 'channel'> {
  channelRef: Cell<RealtimeChannel | null>;
  structuralSignature: Cell<string>;
  playbackSignature: Cell<string>;
  handlers: HandlerRegistry;
  setParticipants: (participants: Participant[]) => void;
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
  emitIfPresent(context.handlers.current.anchor, decision.anchor);
}

function applyQueueBroadcast(event: QueueBroadcastEvent, context: InboundContext) {
  void context.queryClient.invalidateQueries({ queryKey: watchKeys.queue(context.roomId) });
  const notice = queueBroadcastNotice(event);
  if (notice) toast.info(notice);
}

function registerInboundListeners(context: InboundContext) {
  const { channel, handlers } = context;
  // Authoritative room snapshots remain the source of truth. The pure model
  // classifies them; this transport layer owns cache invalidation and delivery.
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'watch_rooms', filter: `id=eq.${context.roomId}` },
    (payload: { new: Room }) => applyRoomSnapshot(payload.new, context),
  );
  channel.on('broadcast', { event: 'room' }, () => {
    void context.queryClient.invalidateQueries({ queryKey: watchKeys.room(context.roomId) });
  });
  channel.on('broadcast', { event: 'queue' }, (message: { payload: QueueBroadcastEvent }) => {
    applyQueueBroadcast(message.payload, context);
  });
  // ADR-0011: low-latency anchors and authoritative snapshots intentionally
  // converge on the same downstream handlers, which dedupe by anchor freshness.
  channel.on('broadcast', { event: 'anchor' }, (message: { payload: PlaybackAnchor }) => {
    emitIfPresent(handlers.current.anchor, message.payload);
  });
  channel.on('broadcast', { event: 'chat' }, (message: { payload: ChatMessage }) => {
    emitIfPresent(handlers.current.chat, message.payload);
  });
  channel.on('broadcast', { event: 'reaction' }, (message: { payload: ReactionEvent }) => {
    emitIfPresent(handlers.current.reaction, message.payload);
  });
  channel.on('broadcast', { event: 'message-reaction' }, (message: { payload: MessageReaction }) => {
    emitIfPresent(handlers.current.messageReaction, message.payload);
  });
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

function connectRoomChannel(context: ConnectionContext) {
  const supabase = createSupabaseBrowserClient();
  const channel = supabase.channel(`room:${context.roomId}`, {
    config: { presence: { key: context.userId } },
  });
  context.channelRef.current = channel;
  registerInboundListeners({
    channel,
    roomId: context.roomId,
    queryClient: context.queryClient,
    structuralSignature: context.structuralSignature,
    playbackSignature: context.playbackSignature,
    handlers: context.handlers,
    setParticipants: context.setParticipants,
  });
  channel.subscribe((status) => {
    void handleSubscriptionStatus(status, { ...context, channel });
  });
  return () => {
    void supabase.removeChannel(channel);
    context.channelRef.current = null;
  };
}

function trackPresenceIfJoined(channel: RealtimeChannel | null, userId: string, isHost: boolean, joinedAt: number) {
  if (channel?.state === 'joined') void channel.track({ userId, isHost, joinedAt });
}

function sendBroadcast<T>(channel: RealtimeChannel | null, event: string, payload: T) {
  if (channel?.state === 'joined') channel.send({ type: 'broadcast', event, payload });
}

function useRoomEventRegistry() {
  const handlersRef = useRef<EventHandlerSets>({
    anchor: new Set(),
    chat: new Set(),
    reaction: new Set(),
    messageReaction: new Set(),
  });
  const onAnchor = useCallback((handler: (value: PlaybackAnchor) => void) => {
    handlersRef.current.anchor.add(handler);
    return () => handlersRef.current.anchor.delete(handler);
  }, []);
  const onChat = useCallback((handler: (value: ChatMessage) => void) => {
    handlersRef.current.chat.add(handler);
    return () => handlersRef.current.chat.delete(handler);
  }, []);
  const onReaction = useCallback((handler: (value: ReactionEvent) => void) => {
    handlersRef.current.reaction.add(handler);
    return () => handlersRef.current.reaction.delete(handler);
  }, []);
  const onMessageReaction = useCallback((handler: (value: MessageReaction) => void) => {
    handlersRef.current.messageReaction.add(handler);
    return () => handlersRef.current.messageReaction.delete(handler);
  }, []);
  return {
    handlersRef,
    events: { onAnchor, onChat, onReaction, onMessageReaction } satisfies RoomRealtimeEvents,
  };
}

function useRoomChannelTransport(room: Room, userId: string, isHost: boolean, handlers: HandlerRegistry) {
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [channelStatus, setChannelStatus] = useState<ChannelConnectionStatus>('connecting');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const structuralSignature = useRef(getStructuralSignature(room));
  const playbackSignature = useRef(getPlaybackSignature(room));
  const isHostRef = useRef(isHost);
  const joinedAt = useRef(0);
  const wasDisconnected = useRef(false);
  const telemetry = useTelemetryRef();

  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => {
    structuralSignature.current = getStructuralSignature(room);
    playbackSignature.current = getPlaybackSignature(room);
  }, [room]);
  useEffect(() => { joinedAt.current = Date.now(); }, []);
  useEffect(() => connectRoomChannel({
    roomId: room.id,
    userId,
    queryClient,
    telemetry,
    isHost: isHostRef,
    joinedAt,
    wasDisconnected,
    setChannelStatus,
    channelRef,
    structuralSignature,
    playbackSignature,
    handlers,
    setParticipants,
  }), [room.id, userId, queryClient, telemetry, handlers]);
  // Host role changes update presence without tearing down the realtime channel.
  useEffect(() => {
    trackPresenceIfJoined(channelRef.current, userId, isHost, joinedAt.current);
  }, [isHost, userId]);

  return { participants, channelStatus, channelRef };
}

function useRoomBroadcasters(channelRef: Cell<RealtimeChannel | null>) {
  const broadcastQueueEvent = useCallback((event: QueueBroadcastEvent) => {
    sendBroadcast(channelRef.current, 'queue', event);
  }, [channelRef]);
  const broadcastRoomEvent = useCallback((event: RoomBroadcastEvent) => {
    sendBroadcast(channelRef.current, 'room', event);
  }, [channelRef]);
  const broadcastAnchor = useCallback((anchor: PlaybackAnchor) => {
    sendBroadcast(channelRef.current, 'anchor', anchor);
  }, [channelRef]);
  const broadcastChat = useCallback((message: ChatMessage) => {
    sendBroadcast(channelRef.current, 'chat', message);
  }, [channelRef]);
  const broadcastReaction = useCallback((reaction: ReactionEvent) => {
    sendBroadcast(channelRef.current, 'reaction', reaction);
  }, [channelRef]);
  const broadcastMessageReaction = useCallback((reaction: MessageReaction) => {
    sendBroadcast(channelRef.current, 'message-reaction', reaction);
  }, [channelRef]);
  return {
    broadcastQueueEvent,
    broadcastRoomEvent,
    broadcastAnchor,
    broadcastChat,
    broadcastReaction,
    broadcastMessageReaction,
  };
}

export function useRoomChannel(room: Room, userId: string, isHost: boolean) {
  const registry = useRoomEventRegistry();
  const transport = useRoomChannelTransport(room, userId, isHost, registry.handlersRef);
  return {
    participants: transport.participants,
    events: registry.events,
    channelStatus: transport.channelStatus,
    ...useRoomBroadcasters(transport.channelRef),
  };
}
