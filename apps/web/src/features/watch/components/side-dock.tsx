"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, Button, Avatar, AvatarFallback, AvatarImage } from "@pumni/ui";
import { Crown, Users, ListVideo, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ParticipantRail } from "./participant-rail";
import { PlaylistPanel } from "./playlist-panel";
import { ChatPanel } from "./chat-panel";
import { type ReactionOverlayRef } from "./reaction-overlay";
import { useTransferHost } from "../hooks/use-room-queue";
import type { Participant, QueueItem, QueueBroadcastEvent, ChatMessage } from "../types";

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
  reactionOverlayRef?: React.RefObject<ReactionOverlayRef | null>;
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
        toast.success("Đã chuyển quyền chủ phòng thành công!");
      },
      onError: (err) => {
        toast.error(err.message || "Chuyển quyền thất bại.");
      },
    });
  };

  return (
    <Card variant="solid" className="h-full flex flex-col rounded-xl overflow-hidden select-none p-0">
      <div className="p-4 flex flex-col gap-4 flex-1 h-full min-h-0">
        <Tabs defaultValue="playlist" className="w-full flex-1 flex flex-col h-full min-h-0">
          <TabsList className="grid grid-cols-3 h-9 p-1 bg-muted border border-border rounded-lg shrink-0">
            <TabsTrigger value="playlist" className="text-xs flex items-center justify-center gap-1 h-full">
              <ListVideo className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Danh sách</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs flex items-center justify-center gap-1.5 h-full">
              <MessageSquare className="size-3.5 shrink-0" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="participants" className="text-xs flex items-center justify-center gap-1.5 h-full">
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
          <TabsContent value="chat" className="flex-1 mt-3 focus-visible:outline-none flex flex-col min-h-0">
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
          <TabsContent value="participants" className="flex-1 mt-3 flex flex-col gap-4 focus-visible:outline-none overflow-hidden min-h-0">
            {/* Visual avatar rail */}
            <ParticipantRail participants={participants} profiles={profiles} />

            {/* List with action buttons */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">
                Quản lý thành viên
              </span>
              
              <div className="flex flex-col gap-1.5">
                {participants.map((p) => {
                  const isCurrentUser = p.userId === userId;
                  const profile = profiles[p.userId];
                  const displayName = profile?.username ?? (isCurrentUser ? "Bạn" : `User: ${p.userId.slice(0, 8)}`);
                  const initials = profile?.username 
                    ? profile.username.slice(0, 2) 
                    : p.userId.slice(0, 2);

                  return (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-7 border border-border shrink-0">
                          {profile?.avatar_url && (
                            <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />
                          )}
                          <AvatarFallback className="text-[10px] font-bold uppercase select-none bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate pr-1 font-medium text-foreground">
                            {isCurrentUser && profile?.username ? `${displayName} (Bạn)` : displayName}
                          </span>
                          {p.isHost && (
                            <span className="text-[9px] text-primary font-medium flex items-center gap-0.5 mt-0.5">
                              <Crown className="size-2.5 fill-current" />
                              Chủ phòng
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Host action: Transfer host role */}
                      {isHost && !p.isHost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleTransferHost(p.userId)}
                          className="h-7 text-xs px-2 text-primary motion-safe:hover:bg-primary/10 hover:text-primary border border-primary/20"
                        >
                          <Crown className="size-3 mr-1" />
                          Host
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
