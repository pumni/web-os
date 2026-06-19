'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatMessageSchema } from '@pumni/validators';
import type { ChatMessage, ReactionEvent, RoomRealtimeEvents } from '../types';

const MAX_MESSAGES = 100;

export function useRoomChat(
  userId: string,
  broadcastChat: (m: ChatMessage) => void,
  broadcastReaction: (r: ReactionEvent) => void,
  roomEvents: Pick<RoomRealtimeEvents, 'onChat' | 'onReaction'>,
  onLocalReaction?: (r: ReactionEvent) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const onLocalReactionRef = useRef(onLocalReaction);

  useEffect(() => {
    onLocalReactionRef.current = onLocalReaction;
  }, [onLocalReaction]);

  // Nhận từ người khác — lọc trùng theo id (resilience nếu self-echo/đổi config sau này)
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
    receiveChat(msg); // tự append (self:false) — đi qua bộ lọc trùng
    return true;
  };

  const sendReaction = (emoji: string) => {
    const reaction: ReactionEvent = { id: crypto.randomUUID(), userId, emoji, sentAt: Date.now() };
    broadcastReaction(reaction);
    onLocalReaction?.(reaction);
  };

  return { messages, receiveChat, sendChat, sendReaction };
}
