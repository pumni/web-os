'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatMessageSchema } from '@pumni/validators';
import type { ChatMessage, MessageReaction, ReactionEvent, RoomRealtimeEvents } from '../types';
import { isReactionEmoji } from '../reaction-emojis';

const MAX_MESSAGES = 100;

/** messageId -> (userId -> emoji). Each participant holds at most one reaction per message. */
export type MessageReactionMap = Record<string, Record<string, string>>;

export function useRoomChat(
  userId: string,
  broadcastChat: (m: ChatMessage) => void,
  broadcastReaction: (r: ReactionEvent) => void,
  broadcastMessageReaction: (r: MessageReaction) => void,
  roomEvents: Pick<RoomRealtimeEvents, 'onChat' | 'onReaction' | 'onMessageReaction'>,
  onLocalReaction?: (r: ReactionEvent) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageReactions, setMessageReactions] = useState<MessageReactionMap>({});
  const onLocalReactionRef = useRef(onLocalReaction);

  useEffect(() => {
    onLocalReactionRef.current = onLocalReaction;
  }, [onLocalReaction]);

  // Received from others — filter duplicates by id (resilience against self-echo or configuration changes)
  const receiveChat = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].slice(-MAX_MESSAGES);
    });
  }, []);

  useEffect(() => {
    return roomEvents.onChat(receiveChat);
  }, [receiveChat, roomEvents]);

  useEffect(() => {
    return roomEvents.onReaction((reaction) => {
      onLocalReactionRef.current?.(reaction);
    });
  }, [roomEvents]);

  // Apply a message reaction (local or received). Guards untrusted broadcast input.
  const applyMessageReaction = useCallback((r: MessageReaction) => {
    if (typeof r.messageId !== 'string' || typeof r.userId !== 'string') return;
    if (r.emoji !== null && !isReactionEmoji(r.emoji)) return;
    setMessageReactions((prev) => {
      const forMessage = { ...(prev[r.messageId] ?? {}) };
      if (r.emoji === null) {
        delete forMessage[r.userId];
      } else {
        forMessage[r.userId] = r.emoji;
      }
      const next = { ...prev };
      if (Object.keys(forMessage).length === 0) {
        delete next[r.messageId];
      } else {
        next[r.messageId] = forMessage;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return roomEvents.onMessageReaction(applyMessageReaction);
  }, [applyMessageReaction, roomEvents]);

  const sendChat = (text: string) => {
    const parsed = chatMessageSchema.safeParse({ text });
    if (!parsed.success) return false;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      text: parsed.data.text,
      sentAt: Date.now(),
    };
    broadcastChat(msg);
    receiveChat(msg); // Append locally — filtered for duplicates
    return true;
  };

  const sendReaction = (emoji: string) => {
    const reaction: ReactionEvent = { id: crypto.randomUUID(), userId, emoji, sentAt: Date.now() };
    broadcastReaction(reaction);
    onLocalReaction?.(reaction);
  };

  // Toggle the current user's reaction on a message; broadcasts + applies locally.
  const toggleMessageReaction = (messageId: string, emoji: string) => {
    if (!isReactionEmoji(emoji)) return;
    const current = messageReactions[messageId]?.[userId];
    const reaction: MessageReaction = {
      messageId,
      userId,
      emoji: current === emoji ? null : emoji,
    };
    broadcastMessageReaction(reaction);
    applyMessageReaction(reaction);
  };

  return {
    messages,
    receiveChat,
    sendChat,
    sendReaction,
    messageReactions,
    toggleMessageReaction,
  };
}
