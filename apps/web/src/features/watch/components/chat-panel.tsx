'use client';

import { Bubble, BubbleContent } from '@pumni/ui/feedback';
import { Button, Input } from '@pumni/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@pumni/ui/layout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@pumni/ui/overlay';
import { MessageSquare, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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

type ChatProfile = { username: string | null; avatar_url: string | null };
type BubbleGroupPosition = 'single' | 'first' | 'middle' | 'last';

interface ChatBubbleRowProps {
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="size-6 cursor-pointer">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="left" align="center">
            {displayName}
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="size-6" />
      )}
    </div>
  );
}

function formatChatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// fallow-ignore-next-line complexity
function ChatBubbleRow({ msg, isMe, profile, groupPosition }: ChatBubbleRowProps) {
  const displayName = profile?.username ?? (isMe ? 'B?n' : `User #${msg.userId.slice(0, 6)}`);
  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : msg.userId.slice(0, 2).toUpperCase();

  return (
    <div
      className={`group flex gap-1.5 text-xs outline-none ${
        isMe ? 'flex-row-reverse items-end self-end' : 'items-end self-start'
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
      <Bubble align={isMe ? 'end' : 'start'} variant={isMe ? 'primary' : 'muted'} shape={groupPosition}>
        <BubbleContent timeLabel={formatChatTime(msg.sentAt)}>
          {msg.text}
        </BubbleContent>
      </Bubble>
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
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 48;
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (logRef.current && isNearBottomRef.current) {
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
    <div className="relative flex min-h-0 flex-1 flex-col select-none">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          className="relative flex h-full min-h-0 scrollbar-gutter-stable flex-col gap-0 overflow-x-hidden overflow-y-auto px-2 py-1"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MessageSquare className="mb-2 size-8 stroke-[1.5] opacity-40" />
              <span className="type-caption">Chưa có tin nhắn nào.</span>
              <span className="mt-0.5 type-caption text-muted-foreground">Bắt đầu trò chuyện!</span>
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
                <ChatBubbleRow
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
      <form onSubmit={handleSubmit} className="mx-4 flex shrink-0 items-end gap-1.5 pt-2">
        <div className="relative flex-1">
          <Input
            placeholder="Nhắn tin..."
            aria-label="Nhập tin nhắn"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="h-9 flex-1 rounded-full border border-border surface-raised pe-10 text-xs"
            maxLength={500}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
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
