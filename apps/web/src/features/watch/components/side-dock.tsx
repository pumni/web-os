'use client';

import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
} from '@pumni/ui';
import { Users, ListVideo, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ParticipantRail } from './participant-rail';
import { PlaylistPanel } from './playlist-panel';
import { ChatPanel } from './chat-panel';
import type { ReactionOverlayRef } from './reaction-overlay';
import { useTransferHost } from '../hooks/use-room-queue';
import type { Participant, QueueItem, QueueBroadcastEvent, ChatMessage } from '../types';

interface SideDockProps {
  roomId: string;
  userId: string;
  isHost: boolean;
  participants: Participant[];
  queueItems: QueueItem[];
  currentQueueItemId: string | null;
  profiles?: Record<string, { username: string | null; avatar_url: string | null }>;
  broadcastQueueEvent: (e: QueueBroadcastEvent) => void;
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
  profiles = {},
  broadcastQueueEvent,
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
      },
      onError: (err) => {
        toast.error(err.message || 'Chuyển quyền thất bại.');
      },
    });
  };

  return (
    <Card variant="glass" className="h-full flex flex-col overflow-hidden select-none p-0">
      <div className="p-4 flex flex-col gap-4 flex-1 h-full min-h-0">
        <Tabs defaultValue="playlist" className="w-full flex-1 flex flex-col h-full min-h-0">
          <TabsList className="grid grid-cols-3 h-9 p-1 bg-muted border border-border rounded-lg shrink-0">
            <TabsTrigger
              value="playlist"
              className="text-xs flex items-center justify-center gap-1 h-full"
            >
              <ListVideo className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Danh sách</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="text-xs flex items-center justify-center gap-1.5 h-full"
            >
              <MessageSquare className="size-3.5 shrink-0" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="text-xs flex items-center justify-center gap-1.5 h-full"
            >
              <Users className="size-3.5 shrink-0" />
              <span className="inline-flex items-center justify-center size-4 rounded-full bg-muted text-[10px] font-semibold leading-none">
                {participants.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Playlist Tab */}
          <TabsContent value="playlist" className="flex-1 mt-3 focus-visible:outline-none">
            <PlaylistPanel
              roomId={roomId}
              items={queueItems}
              currentQueueItemId={currentQueueItemId}
              isHost={isHost}
              broadcastQueueEvent={broadcastQueueEvent}
            />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent
            value="chat"
            className="flex-1 mt-3 focus-visible:outline-none flex flex-col min-h-0"
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
            className="flex-1 mt-3 flex flex-col gap-3 focus-visible:outline-none overflow-hidden min-h-0"
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
