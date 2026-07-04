'use client';

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Message,
  MessageAvatar,
  MessageContent,
} from '@pumni/ui/feedback';
import { Button, Input } from '@pumni/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@pumni/ui/layout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@pumni/ui/overlay';
import { cn } from '@pumni/ui/lib/cn';
import { MessageSquare, Send, SmilePlus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { REACTION_EMOJIS } from '../reaction-emojis';
import { ReactionBar } from './reaction-bar';
import { ReactionOverlay, type ReactionOverlayRef } from './reaction-overlay';

interface ChatPanelProps {
  messages: ChatMessage[];
  sendChat: (text: string) => boolean;
  profiles: Record<string, { username: string | null; avatar_url: string | null }>;
  userId: string;
  onReact?: (emoji: string) => void;
  /** messageId -> (userId -> emoji), synced across participants. */
  messageReactions?: Record<string, Record<string, string>>;
  onReactMessage?: (messageId: string, emoji: string) => void;
  reactionOverlayRef?: React.Ref<ReactionOverlayRef>;
}

type ChatProfile = { username: string | null; avatar_url: string | null };

/** Collapse a message's per-user reactions into `[emoji, count]` pairs for display. */
function summarizeReactions(byUser: Record<string, string> | undefined): [string, number][] {
  if (!byUser) return [];
  const counts = new Map<string, number>();
  for (const emoji of Object.values(byUser)) {
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  return [...counts.entries()];
}

/** Emoji picker popover; its trigger is the hover-revealed react button on a bubble. */
function MessageReactionPicker({
  activeEmoji,
  onPick,
}: {
  activeEmoji: string | undefined;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Thêm cảm xúc"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <SmilePlus className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="flex w-auto gap-0.5 rounded-full p-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Thả cảm xúc ${emoji}`}
            aria-pressed={activeEmoji === emoji}
            onClick={() => {
              onPick(emoji);
              setOpen(false);
            }}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-lg transition-transform hover:-translate-y-0.5 hover:bg-muted motion-reduce:hover:translate-y-0',
              activeEmoji === emoji && 'bg-primary/10',
            )}
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Consecutive messages from the same sender, rendered as one Messenger-style cluster. */
interface MessageCluster {
  key: string;
  userId: string;
  isMe: boolean;
  profile?: ChatProfile;
  messages: ChatMessage[];
}

function groupIntoClusters(
  messages: ChatMessage[],
  userId: string,
  profiles: Record<string, ChatProfile>,
): MessageCluster[] {
  const clusters: MessageCluster[] = [];
  for (const msg of messages) {
    const last = clusters.at(-1);
    if (last && last.userId === msg.userId) {
      last.messages.push(msg);
    } else {
      clusters.push({
        key: msg.id,
        userId: msg.userId,
        isMe: msg.userId === userId,
        profile: profiles[msg.userId],
        messages: [msg],
      });
    }
  }
  return clusters;
}

function formatChatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function ChatCluster({
  cluster,
  viewerId,
  messageReactions,
  onReactMessage,
}: {
  cluster: MessageCluster;
  viewerId: string;
  messageReactions: Record<string, Record<string, string>>;
  onReactMessage?: (messageId: string, emoji: string) => void;
}) {
  const { isMe, profile, messages } = cluster;
  const displayName = profile?.username ?? (isMe ? 'Bạn' : `User #${cluster.userId.slice(0, 6)}`);
  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : cluster.userId.slice(0, 2).toUpperCase();

  return (
    <Message align={isMe ? 'end' : 'start'} className="gap-1.5">
      {/* Messenger: your own (right-side) avatar is never shown. */}
      {!isMe && (
        <MessageAvatar className="size-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-6 cursor-pointer">
                {profile?.avatar_url && (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={displayName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              {displayName}
            </TooltipContent>
          </Tooltip>
        </MessageAvatar>
      )}
      <MessageContent>
        <BubbleGroup>
          {messages.map((msg) => {
            const byUser = messageReactions[msg.id];
            const summary = summarizeReactions(byUser);
            const myEmoji = byUser?.[viewerId];
            return (
              // Reacted bubbles need bottom room so the badge doesn't collide with the next bubble.
              <Bubble
                key={msg.id}
                variant={isMe ? 'primary' : 'muted'}
                className={summary.length > 0 ? 'mb-2' : undefined}
              >
                <BubbleContent
                  timeLabel={formatChatTime(msg.sentAt)}
                  reactAction={
                    onReactMessage ? (
                      <MessageReactionPicker
                        activeEmoji={myEmoji}
                        onPick={(emoji) => onReactMessage(msg.id, emoji)}
                      />
                    ) : undefined
                  }
                >
                  {msg.text}
                </BubbleContent>
                {summary.length > 0 && (
                  <BubbleReactions
                    align={isMe ? 'start' : 'end'}
                    aria-label={`Cảm xúc: ${summary
                      .map(([emoji, count]) => (count > 1 ? `${emoji} ${count}` : emoji))
                      .join(', ')}`}
                  >
                    {summary.map(([emoji, count]) => (
                      <span key={emoji}>
                        {emoji}
                        {count > 1 ? ` ${count}` : ''}
                      </span>
                    ))}
                  </BubbleReactions>
                )}
              </Bubble>
            );
          })}
        </BubbleGroup>
      </MessageContent>
    </Message>
  );
}

export function ChatPanel({
  messages,
  sendChat,
  profiles,
  userId,
  onReact,
  messageReactions = {},
  onReactMessage,
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
          className="relative flex h-full min-h-0 scrollbar-gutter-stable flex-col gap-3 overflow-x-hidden overflow-y-auto px-2 py-1"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MessageSquare className="mb-2 size-8 stroke-[1.5] opacity-40" />
              <span className="type-caption">Chưa có tin nhắn nào.</span>
              <span className="mt-0.5 type-caption text-muted-foreground">Bắt đầu trò chuyện!</span>
            </div>
          ) : (
            groupIntoClusters(messages, userId, profiles).map((cluster) => (
              <ChatCluster
                key={cluster.key}
                cluster={cluster}
                viewerId={userId}
                messageReactions={messageReactions}
                onReactMessage={onReactMessage}
              />
            ))
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
            className="h-9 flex-1 rounded-full border border-border pe-10 text-xs surface-raised"
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
