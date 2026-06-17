'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, Input, Avatar, AvatarFallback, AvatarImage } from '@pumni/ui';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types';
import { ReactionBar } from './reaction-bar';

interface ChatPanelProps {
  messages: ChatMessage[];
  sendChat: (text: string) => boolean;
  profiles: Record<string, { username: string | null; avatar_url: string | null }>;
  userId: string;
  onReact?: (emoji: string) => void;
}

function formatChatTime(ts: number): string {
  const d = new Date(ts);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

export function ChatPanel({
  messages,
  sendChat,
  profiles,
  userId,
  onReact,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const ok = sendChat(inputText.trim());
    if (ok) {
      setInputText('');
    }
  };

  return (
    <div className="relative flex flex-col h-full select-none">
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1 pb-1"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
            <MessageSquare className="size-8 stroke-[1.5] mb-2 opacity-40" />
            <span className="type-caption">Chưa có tin nhắn nào.</span>
            <span className="type-caption mt-0.5 text-muted-foreground">Bắt đầu trò chuyện!</span>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId === userId;
            const profile = profiles[msg.userId];
            const displayName =
              profile?.username ?? (isMe ? 'Bạn' : `User #${msg.userId.slice(0, 6)}`);
            const initials = profile?.username
              ? profile.username.slice(0, 2).toUpperCase()
              : msg.userId.slice(0, 2).toUpperCase();

            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isGrouped = prevMsg != null && prevMsg.userId === msg.userId;

            return (
              <div
                key={msg.id}
                className={`flex gap-1.5 text-xs ${
                  isMe ? 'self-end flex-row-reverse items-end' : 'self-start items-end'
                } max-w-[88%] ${isGrouped ? 'mt-0.5' : 'mt-2'}`}
              >
                {!isMe && (
                  <div className="shrink-0 mb-0.5">
                    {!isGrouped ? (
                      <Avatar className="size-6 border border-border">
                        {profile?.avatar_url && (
                          <AvatarImage
                            src={profile.avatar_url}
                            alt={displayName}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="size-6" />
                    )}
                  </div>
                )}

                <div
                  className={`flex flex-col gap-0.5 min-w-0 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {!isMe && !isGrouped && (
                    <span className="type-caption text-muted-foreground px-1 truncate max-w-30">
                      {displayName}
                    </span>
                  )}

                  <div className="flex items-end gap-1.5">
                    {isMe && (
                      <span className="type-caption text-muted-foreground shrink-0 mb-0.5">
                        {formatChatTime(msg.sentAt)}
                      </span>
                    )}
                    <div
                      className={`px-3 py-1.5 wrap-break-word max-w-full ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                          : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap text-xs select-text">
                        {msg.text}
                      </p>
                    </div>
                    {!isMe && (
                      <span className="type-caption text-muted-foreground shrink-0 mb-0.5">
                        {formatChatTime(msg.sentAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reaction Bar — standalone component */}
      {onReact && (
        <div className="shrink-0 border-t border-border">
          <ReactionBar onReact={onReact} />
        </div>
      )}

      {/* Input — pill-shaped with embedded send button */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 shrink-0 pt-2 border-t border-border">
        <div className="relative flex-1">
          <Input
            placeholder="Nhắn tin..."
            aria-label="Nhập tin nhắn"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="h-9 text-xs flex-1 pe-10 rounded-full border border-border bg-muted"
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-full"
            disabled={!inputText.trim()}
            aria-label="Gửi tin nhắn"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}