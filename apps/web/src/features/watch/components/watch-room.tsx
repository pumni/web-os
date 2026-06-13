"use client";

import React, { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { MediaPlayerInstance } from "@vidstack/react";
import { 
  Button, 
  Input, 
  Label, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  Tabs, 
  TabsList, 
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@pumni/ui";
import { toast } from "sonner";
import { Copy, ArrowLeft, ListVideo } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useServerClock } from "../hooks/use-server-clock";
import { useRoomChannel } from "../hooks/use-room-channel";
import { useSyncController } from "../hooks/use-sync-controller";
import { SyncPlayer } from "./sync-player";
import { RoomControls } from "./room-controls";
import { SyncIndicator } from "./sync-indicator";
import { SideDock } from "./side-dock";
import { setRoomSource, leaveRoom } from "../actions";
import { useRoomQuery } from "../hooks/use-room-query";
import { useQueueQuery } from "../hooks/use-room-queue";
import { watchKeys } from "../query-keys";
import type { Room, PlaybackAnchor, QueueItem } from "../types";
import { TapToPlayOverlay } from "./tap-to-play-overlay";
import { HostClaimBanner } from "./host-claim-banner";
import { useHostHeartbeat } from "../hooks/use-host-heartbeat";
import { useMemberProfiles } from "../hooks/use-room-members";

interface WatchRoomProps {
  room: Room;
  userId: string;
  initialQueueItems: QueueItem[];
}

export function WatchRoom({ room, userId, initialQueueItems }: WatchRoomProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const playerRef = useRef<MediaPlayerInstance>(null);

  // Mobile Side Dock Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Source change modal state (Host only)
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<"youtube" | "url">("youtube");
  const [newSourceRef, setNewSourceRef] = useState("");

  const queryClient = useQueryClient();

  // 1. Join room membership on mount, then refetch member-gated data.
  // RSC render cannot INSERT, so membership is registered client-side; the
  // queue is RLS-gated on membership, so we MUST invalidate after joining or a
  // link-joiner sees an empty queue until staleTime expires.
  useEffect(() => {
    let cancelled = false;
    async function join(attempt = 0) {
      try {
        const res = await fetch(`/api/watch/${room.id}/join`, { method: "POST" });
        if (!res.ok) throw new Error(`join failed: ${res.status}`);
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
        await queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
      } catch (err) {
        if (cancelled) return;
        if (attempt < 3) {
          setTimeout(() => void join(attempt + 1), 1000 * (attempt + 1));
        } else {
          console.error("Failed to join room after retries", err);
          toast.error("Không thể tham gia phòng. Một số thao tác có thể bị hạn chế — hãy tải lại trang.");
        }
      }
    }
    void join();
    return () => {
      cancelled = true;
    };
  }, [room.id, queryClient]);

  // 2. Sync clock
  const { ready: clockReady, serverClock } = useServerClock();

  // 3. Query hooks
  const { data: currentRoom } = useRoomQuery(room.id, room);
  const { data: queueItems } = useQueueQuery(room.id, initialQueueItems);

  const isHost = currentRoom.host_id === userId;

  useHostHeartbeat(currentRoom.id, isHost);

  // We use a ref to sever the circular hook dependency
  const onAnchorRef = useRef<(anchor: PlaybackAnchor) => void>(() => {});

  // 4. Realtime channel (Broadcast anchor + Presence + postgres_changes).
  const { participants, broadcastAnchor, channelStatus } = useRoomChannel(
    currentRoom,
    userId,
    isHost,
    (anchor) => onAnchorRef.current(anchor)
  );

  // 5. Sync Controller (Soft-lock + Resync)
  const {
    syncStatus,
    isFollowingHost,
    needsGesture,
    resync,
    resumeFromGesture,
    handleReceiveAnchor,
    playerHandlers,
  } = useSyncController(
    playerRef,
    currentRoom,
    isHost,
    serverClock,
    broadcastAnchor
  );

  const { data: profiles = {} } = useMemberProfiles(participants.map((p) => p.userId));

  // Wire up the ref inside useEffect to comply with render purity rules
  useEffect(() => {
    onAnchorRef.current = handleReceiveAnchor;
  }, [handleReceiveAnchor]);

  const hostPresent = participants.some((p) => p.isHost);
  const [showClaim, setShowClaim] = useState(false);
  useEffect(() => {
    if (isHost || hostPresent) {
      setShowClaim(false);
      return;
    }
    const t = setTimeout(() => setShowClaim(true), 10_000);
    return () => clearTimeout(t);
  }, [isHost, hostPresent]);

  // Leaving is a DELIBERATE user action — never an effect teardown or
  // `beforeunload`. Those fire on React StrictMode's dev double-mount and on
  // tab churn, which (via delete-on-empty) previously deleted the freshly
  // created room and produced a 404. Empty-room cleanup happens here on an
  // explicit leave; abandoned rooms (tab closed) are reaped by the TTL cron.
  const handleLeave = () => {
    void leaveRoom(currentRoom.id);
    router.push("/watch" as Route);
  };

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
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(currentRoom.id) });
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
    <div className="w-full flex-1 flex flex-col gap-4 p-4 min-h-0 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full select-none shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeave}
            aria-label="Back to Lobby"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                Phòng xem chung
              </h1>
              <SyncIndicator status={syncStatus} />
              {channelStatus !== "connected" && (
                <span
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center rounded-sm bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive animate-pulse"
                >
                  Mất kết nối...
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Mã phòng: <span className="font-mono font-bold text-foreground">{currentRoom.code}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="text-xs">
            Mã phòng
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyLink} className="text-xs">
            <Copy className="size-3.5 mr-1" />
            Sao chép link
          </Button>

          {/* Mobile Sheet Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSheetOpen(true)}
            className="lg:hidden flex"
            aria-label="Hàng chờ và Người xem"
          >
            <ListVideo className="size-5" />
          </Button>
        </div>
      </div>

      {showClaim && !isHost && <HostClaimBanner roomId={currentRoom.id} />}

      {/* Main Zones Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 items-stretch min-h-0">
        {/* Left: Stage (Video Player) */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <SyncPlayer
            sourceType={currentRoom.source_type}
            sourceRef={currentRoom.source_ref}
            playerRef={playerRef}
            {...playerHandlers}
          >
            <RoomControls
              isHost={isHost}
              onSourceChange={() => setIsSourceModalOpen(true)}
              isFollowingHost={isFollowingHost}
              resync={resync}
            />
            {needsGesture && <TapToPlayOverlay onResume={resumeFromGesture} />}
          </SyncPlayer>
        </div>

        {/* Right: Side Dock (Desktop only) */}
        <div className="hidden lg:block w-[340px] shrink-0 min-h-0">
          <SideDock
            roomId={currentRoom.id}
            userId={userId}
            isHost={isHost}
            participants={participants}
            queueItems={queueItems}
            currentQueueItemId={currentRoom.current_queue_item_id}
            profiles={profiles}
          />
        </div>
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-background/95 border-l border-border/20 flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-border/20 shrink-0">
            <SheetTitle className="text-sm font-semibold">Bảng điều khiển</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            <SideDock
              roomId={currentRoom.id}
              userId={userId}
              isHost={isHost}
              participants={participants}
              queueItems={queueItems}
              currentQueueItemId={currentRoom.current_queue_item_id}
              profiles={profiles}
            />
          </div>
        </SheetContent>
      </Sheet>

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
