"use client";

import React, { useRef, useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { MediaPlayerInstance } from "@vidstack/react";
import { Button, Card, CardContent, Input, Label, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger } from "@pumni/ui";
import { toast } from "sonner";
import { Copy, ArrowLeft } from "lucide-react";

import { useServerClock } from "../hooks/use-server-clock";
import { useRoomChannel } from "../hooks/use-room-channel";
import { useSyncController } from "../hooks/use-sync-controller";
import { SyncPlayer } from "./sync-player";
import { RoomControls } from "./room-controls";
import { ParticipantRail } from "./participant-rail";
import { SyncIndicator } from "./sync-indicator";
import { setRoomSource } from "../actions";
import type { Room, PlaybackAnchor } from "../types";

interface WatchRoomProps {
  room: Room;
  userId: string;
}

export function WatchRoom({ room, userId }: WatchRoomProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const playerRef = useRef<MediaPlayerInstance>(null);

  // Source change modal state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<"youtube" | "url">("youtube");
  const [newSourceRef, setNewSourceRef] = useState("");

  const isHost = room.host_id === userId;

  // 1. Sync clock
  const { ready: clockReady, serverClock } = useServerClock();

  // We use a ref to sever the circular hook dependency
  const onAnchorRef = useRef<(anchor: PlaybackAnchor) => void>(() => {});

  // 2. Realtime channel (Presence + Broadcast + DB Postgres Changes)
  const { currentRoom, participants, broadcastAnchor } = useRoomChannel(
    room,
    userId,
    isHost,
    useCallback((anchor) => onAnchorRef.current(anchor), [])
  );

  // 3. Controller
  const { syncStatus, handleReceiveAnchor, playerHandlers } = useSyncController(
    playerRef,
    currentRoom,
    isHost,
    serverClock,
    broadcastAnchor
  );

  // Wire up the ref inside useEffect to comply with render purity rules
  useEffect(() => {
    onAnchorRef.current = handleReceiveAnchor;
  }, [handleReceiveAnchor]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    toast.success("Đã sao chép mã phòng!");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/watch/${currentRoom.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Đã sao chép liên kết phòng!");
  };

  const handleSourceChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceRef.trim()) {
      toast.error("Vui lòng nhập link hoặc ID video.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await setRoomSource({
          roomId: currentRoom.id,
          sourceType: newSourceType,
          sourceRef: newSourceRef,
        });

        if (res.ok) {
          toast.success("Đổi nguồn phát thành công!");
          setIsSourceModalOpen(false);
          setNewSourceRef("");
        } else {
          toast.error(res.message || "Đổi nguồn phát thất bại.");
        }
      } catch (err) {
        toast.error("Có lỗi xảy ra.");
        console.error(err);
      }
    });
  };

  if (!clockReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 select-none text-foreground/75">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-medium">Đang đồng bộ thời gian với máy chủ...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full select-none">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/watch" as Route)}
            aria-label="Back to Lobby"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                Phòng xem chung
              </h1>
              <SyncIndicator status={syncStatus} />
            </div>
            <span className="text-[10px] text-muted-foreground">
              Mã phòng: <span className="font-mono font-bold text-foreground">{currentRoom.code}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="text-xs">
            Sao chép mã
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyLink} className="text-xs">
            <Copy className="size-3.5 mr-1" />
            Sao chép link
          </Button>
        </div>
      </div>

      {/* Main Grid: Player on left (or center), info/presence on right (or bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Sync Player */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <SyncPlayer
            sourceType={currentRoom.source_type}
            sourceRef={currentRoom.source_ref}
            playerRef={playerRef}
            {...playerHandlers}
          >
            <RoomControls
              isHost={isHost}
              onSourceChange={() => setIsSourceModalOpen(true)}
            />
          </SyncPlayer>
        </div>

        {/* Right Side: Participant list & Room Status */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="border border-border/40">
            <CardContent className="p-4 flex flex-col gap-4">
              <ParticipantRail participants={participants} />
              
              <div className="border-t border-border/20 pt-4 flex flex-col gap-2 select-none">
                <span className="text-xs font-semibold text-muted-foreground">
                  Thông tin phát
                </span>
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nguồn:</span>
                    <span className="text-foreground font-medium capitalize">
                      {currentRoom.source_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground shrink-0">Video:</span>
                    <span className="text-foreground font-mono truncate max-w-[120px]" title={currentRoom.source_ref}>
                      {currentRoom.source_ref}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Source Change Dialog (Host only) */}
      {isHost && (
        <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Đổi nguồn phát video</DialogTitle>
              <DialogDescription className="text-xs">
                Thay đổi nguồn phát video cho tất cả mọi người trong phòng.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSourceChangeSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Nguồn video</Label>
                <Tabs
                  value={newSourceType}
                  onValueChange={(val) => setNewSourceType(val as "youtube" | "url")}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full h-8 p-0.5 bg-muted/50">
                    <TabsTrigger value="youtube" className="text-xs h-7">YouTube</TabsTrigger>
                    <TabsTrigger value="url" className="text-xs h-7">Direct URL (MP4/HLS)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-source-ref" className="text-xs">
                  {newSourceType === "youtube" ? "Link hoặc ID video YouTube" : "Link video trực tiếp"}
                </Label>
                <Input
                  id="new-source-ref"
                  placeholder={
                    newSourceType === "youtube"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://example.com/video.mp4"
                  }
                  value={newSourceRef}
                  onChange={(e) => setNewSourceRef(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSourceModalOpen(false)}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
