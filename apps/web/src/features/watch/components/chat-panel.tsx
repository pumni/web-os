'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, Input, Avatar, AvatarFallback, AvatarImage } from '@pumni/ui';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types';
import { ReactionOverlay, type ReactionOverlayRef } from './reaction-overlay';

interface ChatPanelProps {
  messages: ChatMessage[];
  sendChat: (text: string) => boolean;
  profiles: Record<string, { username: string | null; avatar_url: string | null }>;
  userId: string;
  onReact?: (emoji: string) => void;
  reactionOverlayRef?: React.RefObject<ReactionOverlayRef | null>;
}

export function ChatPanel({
  messages,
  sendChat,
  profiles,
  userId,
  onReact,
  reactionOverlayRef,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages list updates
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
      {/* Floating Reactions Overlay */}
      {reactionOverlayRef && <ReactionOverlay ref={reactionOverlayRef} />}

      {/* Messages Log */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 pb-1"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/40 py-10">
            <MessageSquare className="size-8 stroke-[1.5] mb-2" />
            <span className="text-xs">Chưa có tin nhắn nào.</span>
            <span className="text-xs text-muted-foreground/30 mt-0.5">Bắt đầu trò chuyện!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === userId;
            const profile = profiles[msg.userId];
            const displayName =
              profile?.username ?? (isMe ? 'Bạn' : `User #${msg.userId.slice(0, 6)}`);
            const initials = profile?.username
              ? profile.username.slice(0, 2).toUpperCase()
              : msg.userId.slice(0, 2).toUpperCase();

            return (
              <div
                key={msg.id}
                className={`flex gap-1.5 text-xs ${
                  isMe ? 'self-end flex-row-reverse items-end' : 'self-start items-end'
                } max-w-[88%]`}
              >
                {/* Avatar — only for others */}
                {!isMe && (
                  <Avatar className="size-6 border border-border shrink-0 mb-0.5">
                    {profile?.avatar_url && (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={displayName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-[9px] font-bold bg-primary/15 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-0.5 min-w-0 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Name — only for others */}
                  {!isMe && (
                    <span className="text-xs text-muted-foreground/60 font-medium px-1 truncate max-w-30">
                      {displayName}
                    </span>
                  )}

                  {/* Message Bubble */}
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reaction Bar */}
      {onReact && (
        <div className="flex items-center gap-0.5 px-0.5 py-1 border-t border-border shrink-0 select-none">
          {['❤️', '😂', '😮', '👍', '🎉'].map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => onReact(emoji)}
              className="size-8 p-0 text-base motion-safe:hover:scale-125 transition-transform duration-(--duration-fast) active:scale-90 rounded-lg"
              type="button"
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}

      {/* Input Section */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 shrink-0 pt-1.5 border-t border-border">
        <Input
          placeholder="Nhắn tin..."
          aria-label="Nhập tin nhắn"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="h-8 text-xs flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!inputText.trim()}
          aria-label="Gửi tin nhắn"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
