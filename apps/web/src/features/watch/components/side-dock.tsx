"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Button, Avatar, AvatarFallback, AvatarImage } from "@pumni/ui";
import { Crown, Users, ListVideo } from "lucide-react";
import { toast } from "sonner";
import { ParticipantRail } from "./participant-rail";
import { PlaylistPanel } from "./playlist-panel";
import { useTransferHost } from "../hooks/use-room-queue";
import type { Participant, QueueItem, QueueBroadcastEvent } from "../types";

interface SideDockProps {
  roomId: string;
  userId: string;
  isHost: boolean;
  participants: Participant[];
  queueItems: QueueItem[];
  currentQueueItemId: string | null;
  profiles?: Record<string, { username: string | null; avatar_url: string | null }>;
  broadcastQueueEvent: (e: QueueBroadcastEvent) => void;
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
    <Card className="border border-border/20 bg-background/40 backdrop-blur-xl h-full flex flex-col rounded-xl overflow-hidden shadow-xl select-none">
      <CardContent className="p-4 flex flex-col gap-4 flex-1 h-full">
        <Tabs defaultValue="playlist" className="w-full flex-1 flex flex-col h-full">
          <TabsList className="grid grid-cols-2 h-9 p-1 bg-background/60 border border-border/20 rounded-lg">
            <TabsTrigger value="playlist" className="text-xs flex items-center justify-center gap-1.5 h-full">
              <ListVideo className="size-3.5" />
              Danh sách chờ
            </TabsTrigger>
            <TabsTrigger value="participants" className="text-xs flex items-center justify-center gap-1.5 h-full">
              <Users className="size-3.5" />
              Người xem ({participants.length})
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

          {/* Participants Tab */}
          <TabsContent value="participants" className="flex-1 mt-3 flex flex-col gap-4 focus-visible:outline-none">
            {/* Visual avatar rail */}
            <ParticipantRail participants={participants} profiles={profiles} />

            {/* List with action buttons */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[300px]">
              <span className="text-[11px] font-semibold text-muted-foreground">
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
                      className="flex items-center justify-between p-2 rounded-lg border border-border/10 bg-background/25 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-7 border border-border/25 shrink-0">
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
                          className="h-7 text-[10px] px-2 text-primary hover:bg-primary/10 hover:text-primary border border-primary/10"
                        >
                          <Crown className="size-3 mr-1" />
                          Chuyển Host
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
