'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import { Card, Tabs } from '@pumni/ui/layout';
import { ListVideo, MessageSquare, Users } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useTransferHost } from '../hooks/use-room-queue';
import type {
  ChatMessage,
  Participant,
  QueueBroadcastEvent,
  QueueItem,
  RoomBroadcastEvent,
} from '../types';
import { ChatPanel } from './chat-panel';
import { ParticipantRail } from './participant-rail';
import { PlaylistPanel } from './playlist-panel';
import type { ReactionOverlayRef } from './reaction-overlay';

interface SideDockProps {
  roomId: string;
  userId: string;
  isHost: boolean;
  participants: Participant[];
  queueItems: QueueItem[];
  currentQueueItemId: string | null;
  isMemberReady: boolean;
  profiles?: Record<string, { username: string | null; avatar_url: string | null }>;
  broadcastQueueEvent: (e: QueueBroadcastEvent) => void;
  broadcastRoomEvent: (e: RoomBroadcastEvent) => void;
  messages: ChatMessage[];
  sendChat: (text: string) => boolean;
  onReact?: (emoji: string) => void;
  messageReactions?: Record<string, Record<string, string>>;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onPlayItem?: (item: QueueItem) => void;
  reactionOverlayRef?: React.Ref<ReactionOverlayRef>;
}

export function SideDock({
  roomId,
  userId,
  isHost,
  participants,
  queueItems,
  currentQueueItemId,
  isMemberReady,
  profiles = {},
  broadcastQueueEvent,
  broadcastRoomEvent,
  messages,
  sendChat,
  onReact,
  messageReactions,
  onReactMessage,
  onPlayItem,
  reactionOverlayRef,
}: SideDockProps) {
  const transferHostMutation = useTransferHost(roomId);
  const isPending = transferHostMutation.isPending;

  const handleTransferHost = (newHostId: string) => {
    transferHostMutation.mutate(newHostId, {
      onSuccess: () => {
        toast.success('Đã chuyển quyền chủ phòng thành công!');
        broadcastRoomEvent({ action: 'host-transfer' });
      },
      onError: (err) => {
        toast.error(err.message || 'Chuyển quyền thất bại.');
      },
    });
  };

  return (
    <Card variant="solid" className="flex h-full flex-col p-0 select-none">
      <div className="flex min-h-0 flex-1 flex-col">
        <Tabs defaultValue="playlist" className="min-h-0 w-full flex-1 flex-col">
          <Tabs.List className="grid h-9 shrink-0 grid-cols-3 px-4">
            <Tabs.Trigger value="playlist" className="text-xs">
              <ListVideo className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Danh sách</span>
            </Tabs.Trigger>
            <Tabs.Trigger value="chat" className="text-xs">
              <MessageSquare className="size-3.5 shrink-0" />
              Chat
            </Tabs.Trigger>
            <Tabs.Trigger value="participants" className="text-xs">
              <Users className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Người</span>
              <span className="text-[11px] font-semibold tabular-nums">{participants.length}</span>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Playlist Tab */}
          <Tabs.Content
            value="playlist"
            className="mt-3 flex min-h-0 flex-1 flex-col px-4 focus-visible:outline-none"
          >
            <PlaylistPanel
              roomId={roomId}
              items={queueItems}
              currentQueueItemId={currentQueueItemId}
              isMemberReady={isMemberReady}
              isHost={isHost}
              broadcastQueueEvent={broadcastQueueEvent}
              broadcastRoomEvent={broadcastRoomEvent}
              onPlayItem={onPlayItem}
            />
          </Tabs.Content>

          {/* Chat Tab */}
          <Tabs.Content
            value="chat"
            className="mt-3 flex min-h-0 flex-1 flex-col pb-4 focus-visible:outline-none"
          >
            <ChatPanel
              messages={messages}
              sendChat={sendChat}
              profiles={profiles}
              userId={userId}
              onReact={onReact}
              messageReactions={messageReactions}
              onReactMessage={onReactMessage}
              reactionOverlayRef={reactionOverlayRef}
            />
          </Tabs.Content>

          {/* Participants Tab */}
          <Tabs.Content
            value="participants"
            className="mt-3 flex min-h-0 flex-1 flex-col gap-3 px-4 focus-visible:outline-none"
          >
            <ParticipantRail
              participants={participants}
              profiles={profiles}
              isHost={isHost}
              userId={userId}
              onTransferHost={handleTransferHost}
              isPending={isPending}
            />
          </Tabs.Content>
        </Tabs>
      </div>
    </Card>
  );
}
