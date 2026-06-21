'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Card } from '@pumni/ui';
import { Users, ListVideo, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ParticipantRail } from './participant-rail';
import { PlaylistPanel } from './playlist-panel';
import { ChatPanel } from './chat-panel';
import type { ReactionOverlayRef } from './reaction-overlay';
import { useTransferHost } from '../hooks/use-room-queue';
import type {
  Participant,
  QueueItem,
  QueueBroadcastEvent,
  RoomBroadcastEvent,
  ChatMessage,
} from '../types';

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
    <Card variant="solid" className="flex h-full flex-col overflow-hidden p-0 select-none">
      <div className="flex h-full min-h-0 flex-1 flex-col p-4">
        <Tabs defaultValue="playlist" className="flex h-full min-h-0 w-full flex-1 flex-col">
          <TabsList variant="underline" className="grid h-9 shrink-0 grid-cols-3">
            <TabsTrigger value="playlist" variant="underline" className="text-xs">
              <ListVideo className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Danh sách</span>
            </TabsTrigger>
            <TabsTrigger value="chat" variant="underline" className="text-xs">
              <MessageSquare className="size-3.5 shrink-0" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="participants" variant="underline" className="text-xs">
              <Users className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Người</span>
              <span className="text-[11px] font-semibold tabular-nums">{participants.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* Playlist Tab */}
          <TabsContent value="playlist" className="mt-3 flex-1 focus-visible:outline-none">
            <PlaylistPanel
              roomId={roomId}
              items={queueItems}
              currentQueueItemId={currentQueueItemId}
              isMemberReady={isMemberReady}
              isHost={isHost}
              broadcastQueueEvent={broadcastQueueEvent}
              broadcastRoomEvent={broadcastRoomEvent}
            />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent
            value="chat"
            className="mt-3 flex min-h-0 flex-1 flex-col focus-visible:outline-none"
          >
            <ChatPanel
              messages={messages}
              sendChat={sendChat}
              profiles={profiles}
              userId={userId}
              onReact={onReact}
              reactionOverlayRef={reactionOverlayRef}
            />
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent
            value="participants"
            className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden focus-visible:outline-none"
          >
            <ParticipantRail
              participants={participants}
              profiles={profiles}
              isHost={isHost}
              userId={userId}
              onTransferHost={handleTransferHost}
              isPending={isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
