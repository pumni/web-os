'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, Input, Avatar, AvatarFallback, AvatarImage } from '@pumni/ui';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types';
import { ReactionBar } from './reaction-bar';
import { ReactionOverlay, type ReactionOverlayRef } from './reaction-overlay';

interface ChatPanelProps {
  messages: ChatMessage[];
  sendChat: (text: string) => boolean;
  profiles: Record<string, { username: string | null; avatar_url: string | null }>;
  userId: string;
  onReact?: (emoji: string) => void;
  reactionOverlayRef?: React.Ref<ReactionOverlayRef>;
}

function formatChatTime(ts: number): string {
  const d = new Date(ts);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

type ChatProfile = { username: string | null; avatar_url: string | null };
type BubbleGroupPosition = 'single' | 'first' | 'middle' | 'last';

interface ChatBubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  profile?: ChatProfile;
  groupPosition: BubbleGroupPosition;
}

function MessageAvatar({
  isGrouped,
  displayName,
  initials,
  avatarUrl,
}: {
  isGrouped: boolean;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="mb-px shrink-0">
      {!isGrouped ? (
        <Avatar className="size-6 border border-border">
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
          )}
          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="size-6" />
      )}
    </div>
  );
}

// fallow-ignore-next-line complexity
function BubbleContent({
  isMe,
  groupPosition,
  displayName,
  sentAt,
  children,
}: {
  isMe: boolean;
  groupPosition: BubbleGroupPosition;
  displayName: string;
  sentAt: number;
  children: React.ReactNode;
}) {
  const radiusClass = getBubbleRadiusClass(isMe, groupPosition);

  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && groupPosition === 'first' && (
        <span className="type-caption max-w-32 truncate px-1 text-muted-foreground">
          {displayName}
        </span>
      )}

      {!isMe && groupPosition === 'single' && (
        <span className="type-caption max-w-32 truncate px-1 text-muted-foreground">
          {displayName}
        </span>
      )}

      <div className="relative flex items-end max-w-full">
        <div
          className={`max-w-full wrap-break-word px-3 py-2 text-xs shadow-control ${radiusClass} ${
            isMe ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap leading-snug select-text">{children}</p>
        </div>
        <span
          className={`type-caption pointer-events-none absolute top-1/2 hidden -translate-y-1/2 whitespace-nowrap text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 sm:block ${
            isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'
          }`}
        >
          {formatChatTime(sentAt)}
        </span>
      </div>
    </div>
  );
}

function getBubbleRadiusClass(isMe: boolean, groupPosition: BubbleGroupPosition): string {
  if (groupPosition === 'single') {
    return 'rounded-xl';
  }

  if (isMe) {
    if (groupPosition === 'first') return 'rounded-xl rounded-br-xs';
    if (groupPosition === 'middle') return 'rounded-xl rounded-tr-xs rounded-br-xs';
    return 'rounded-xl rounded-tr-xs';
  }

  if (groupPosition === 'first') return 'rounded-xl rounded-bl-xs';
  if (groupPosition === 'middle') return 'rounded-xl rounded-tl-xs rounded-bl-xs';
  return 'rounded-xl rounded-tl-xs';
}

// fallow-ignore-next-line complexity
function ChatBubble({ msg, isMe, profile, groupPosition }: ChatBubbleProps) {
  const displayName = profile?.username ?? (isMe ? 'Bạn' : `User #${msg.userId.slice(0, 6)}`);
  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : msg.userId.slice(0, 2).toUpperCase();

  return (
    <div
      className={`group flex gap-1.5 text-xs outline-none ${
        isMe ? 'self-end flex-row-reverse items-end' : 'self-start items-end'
      } max-w-[98%] ${groupPosition === 'single' || groupPosition === 'first' ? 'mt-2' : 'mt-0.5'}`}
    >
      {!isMe && (
        <MessageAvatar
          isGrouped={groupPosition !== 'single' && groupPosition !== 'last'}
          displayName={displayName}
          initials={initials}
          avatarUrl={profile?.avatar_url ?? null}
        />
      )}
      <BubbleContent
        isMe={isMe}
        groupPosition={groupPosition}
        displayName={displayName}
        sentAt={msg.sentAt}
      >
        {msg.text}
      </BubbleContent>
    </div>
  );
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
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          className="relative flex h-full min-h-0 flex-col gap-0 overflow-y-auto overflow-x-hidden py-1"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MessageSquare className="mb-2 size-8 stroke-[1.5] opacity-40" />
              <span className="type-caption">Chưa có tin nhắn nào.</span>
              <span className="type-caption mt-0.5 text-muted-foreground">Bắt đầu trò chuyện!</span>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.userId === userId;
              const profile = profiles[msg.userId];
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
              const prevSameSender = prevMsg != null && prevMsg.userId === msg.userId;
              const nextSameSender = nextMsg != null && nextMsg.userId === msg.userId;
              const groupPosition: BubbleGroupPosition =
                prevSameSender && nextSameSender
                  ? 'middle'
                  : prevSameSender
                    ? 'last'
                    : nextSameSender
                      ? 'first'
                      : 'single';

              return (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  profile={profile}
                  groupPosition={groupPosition}
                />
              );
            })
          )}
        </div>
        <ReactionOverlay ref={reactionOverlayRef} className="z-popover" />
      </div>

      {/* Input — pill-shaped with embedded send button */}
      <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-1.5 pt-2">
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
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
            disabled={!inputText.trim()}
            aria-label="Gửi tin nhắn"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
        {onReact && <ReactionBar onReact={onReact} />}
      </form>
    </div>
  );
}
