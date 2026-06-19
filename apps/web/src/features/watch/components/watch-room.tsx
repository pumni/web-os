'use client';

import React, { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import type { MediaPlayerInstance } from '@vidstack/react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  GlassSurface,
  cn,
} from '@pumni/ui';
import { toast } from 'sonner';
import { ArrowLeft, ListVideo, Link2, Hash, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { VideoSourceTabs } from './source-tabs';

import { useServerClock } from '../hooks/use-server-clock';
import { useRoomChannel } from '../hooks/use-room-channel';
import { useSyncController } from '../hooks/use-sync-controller';
import { useHostClaimState } from '../hooks/use-host-claim-state';
import { SyncPlayer } from './sync-player';
import { RoomControls } from './room-controls';
import { SyncIndicator } from './sync-indicator';
import { SideDock } from './side-dock';
import { setRoomSource, leaveRoom } from '../actions';
import { useRoomQuery } from '../hooks/use-room-query';
import { useQueueQuery, useAdvanceQueue } from '../hooks/use-room-queue';
import { watchKeys } from '../query-keys';
import type {
  Room,
  QueueItem,
  RoomBroadcastEvent,
} from '../types';
import { TapToPlayOverlay } from './tap-to-play-overlay';
import { HostClaimBanner } from './host-claim-banner';
import { useHostHeartbeat } from '../hooks/use-host-heartbeat';
import { useMemberProfiles } from '../hooks/use-room-members';
import { useAppUiStore } from '@/stores/app-ui-store';
import { useRoomMembership } from '../hooks/use-room-membership';

// Phase 6 imports
import { useRoomChat } from '../hooks/use-room-chat';
import { useHostAutopromote } from '../hooks/use-host-autopromote';
import type { ReactionOverlayRef } from './reaction-overlay';

interface WatchRoomProps {
  room: Room;
  userId: string;
  initialQueueItems: QueueItem[];
}

// ---------------------------------------------------------------------------
// Extracted hooks & components
// ---------------------------------------------------------------------------

interface SourceChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newSourceType: 'youtube' | 'url';
  setNewSourceType: (type: 'youtube' | 'url') => void;
  newSourceRef: string;
  setNewSourceRef: (ref: string) => void;
  roomId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  broadcastRoomEvent: (event: RoomBroadcastEvent) => void;
}

function SourceChangeDialog({
  open,
  onOpenChange,
  newSourceType,
  setNewSourceType,
  newSourceRef,
  setNewSourceRef,
  roomId,
  queryClient,
  broadcastRoomEvent,
}: SourceChangeDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceRef.trim()) {
      toast.error('Vui lòng nhập link hoặc ID video.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await setRoomSource({
          roomId,
          sourceType: newSourceType,
          sourceRef: newSourceRef,
        });

        if (res.ok) {
          toast.success('Đổi nguồn phát thành công!');
          onOpenChange(false);
          setNewSourceRef('');
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
          broadcastRoomEvent({ action: 'source' });
        } else {
          toast.error(res.message || 'Đổi nguồn phát thất bại.');
        }
      } catch (err) {
        toast.error('Có lỗi xảy ra.');
        console.error(err);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="type-heading text-base">Đổi nguồn phát video</DialogTitle>
          <DialogDescription className="type-caption">
            Thay đổi nguồn phát video cho tất cả mọi người trong phòng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="type-label">Nguồn video</Label>
            <VideoSourceTabs value={newSourceType} onChange={setNewSourceType} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-source-ref" className="type-label">
              {newSourceType === 'youtube'
                ? 'Link hoặc ID video YouTube'
                : 'Link video trực tiếp'}
            </Label>
            <Input
              id="new-source-ref"
              placeholder={
                newSourceType === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://example.com/video.mp4'
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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// WatchRoom
// ---------------------------------------------------------------------------

export function WatchRoom({ room, userId, initialQueueItems }: WatchRoomProps) {
  const router = useRouter();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Mobile Side Dock sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Desktop Side Dock collapsed state
  const [isDockOpen, setIsDockOpen] = useState(true);

  // Auto-play toggle (host-only — when on, video auto-advances after ending)
  const [autoPlay, setAutoPlay] = useState(true);

  // Source change modal state (Host only)
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'youtube' | 'url'>('youtube');
  const [newSourceRef, setNewSourceRef] = useState('');

  const queryClient = useQueryClient();
  const watchPlayerVolume = useAppUiStore((state) => state.watchPlayerVolume);
  const setWatchPlayerVolume = useAppUiStore((state) => state.setWatchPlayerVolume);

  // 1. Join room membership on mount, then refetch member-gated data.
  const membership = useRoomMembership(room.id, queryClient);

  // 2. Sync clock
  const { ready: clockReady, serverClock } = useServerClock();

  // 3. Query hooks
  const { data: currentRoom } = useRoomQuery(room.id, room);
  const { data: queueItems } = useQueueQuery(room.id, initialQueueItems);

  const isHost = currentRoom.host_id === userId;

  const advanceQueueMutation = useAdvanceQueue(currentRoom.id);

  const handleEnded = () => {
    if (!isHost) return;
    if (!autoPlay) return; // User has auto-play off — just stop
    if (queueItems.length === 0) return;
    advanceQueueMutation.mutate(undefined, {
      onSuccess: () => {
        broadcastQueueEvent({ action: 'advance' });
        broadcastRoomEvent({ action: 'advance' });
      },
    });
  };

  useHostHeartbeat(currentRoom.id, userId, isHost);

  const reactionOverlayRef = useRef<ReactionOverlayRef>(null);

  // 4. Realtime channel (Broadcast anchor/room/queue + Presence + Chat + Reactions).
  const {
    participants,
    events: roomEvents,
    broadcastQueueEvent,
    broadcastRoomEvent,
    channelStatus,
    broadcastChat,
    broadcastReaction,
  } = useRoomChannel(currentRoom, userId, isHost);

  // 4.5 Chat & Reactions & Host Auto-promote
  const { messages, sendChat, sendReaction } = useRoomChat(
    userId,
    broadcastChat,
    broadcastReaction,
    roomEvents,
    (r) => reactionOverlayRef.current?.pushReaction(r),
  );

  useHostAutopromote(currentRoom.id, userId, isHost, participants, () =>
    broadcastRoomEvent({ action: 'host-claim' }),
  );

  // 5. Sync Controller (Soft-lock + Resync)
  const {
    syncStatus,
    isFollowingHost,
    needsGesture,
    resync,
    resumeFromGesture,
    playerHandlers,
    controlHandlers,
  } = useSyncController(playerRef, currentRoom, isHost, serverClock, roomEvents);

  const { data: profiles = {} } = useMemberProfiles(participants.map((p) => p.userId));

  const hostPresent = participants.some((p) => p.isHost);
  const showClaim = useHostClaimState(isHost, hostPresent);

  // Leaving is a DELIBERATE user action — never an effect teardown or
  // `beforeunload`. Those fire on React StrictMode's dev double-mount and on
  // tab churn, which (via delete-on-empty) previously deleted the freshly
  // created room and produced a 404. Empty-room cleanup happens here on an
  // explicit leave; abandoned rooms (tab closed) are reaped by the TTL cron.
  const handleLeave = () => {
    void leaveRoom(currentRoom.id);
    router.push('/watch' as Route);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    toast.success('Đã sao chép mã phòng!');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/watch/${currentRoom.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Đã sao chép liên kết phòng!');
  };

  if (!clockReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 min-h-0">
        <GlassSurface
          variant="panel"
          className="flex flex-col items-center justify-center gap-4 px-8 py-10 rounded-xl max-w-xs w-full select-none"
        >
          <div className="size-10 motion-safe:animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="type-caption text-muted-foreground">Đang đồng bộ với máy chủ...</span>
        </GlassSurface>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-3 p-4 min-h-0 select-none">
      {/* Top Header Bar */}
      <GlassSurface
        variant="bar"
        className="flex items-center justify-between w-full select-none shrink-0 px-3 py-2 rounded-xl"
      >
        {/* Left: Back + Title + Status */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeave}
            aria-label="Rời phòng"
            className="size-8 shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="type-heading text-sm truncate">Phòng xem chung</h2>
            <SyncIndicator status={syncStatus} />
            {channelStatus !== 'connected' && (
              <span
                role="status"
                aria-live="polite"
                className="hidden sm:inline-flex items-center rounded-sm bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive motion-safe:animate-pulse"
              >
                Mất kết nối
              </span>
            )}
          </div>
        </div>

        {/* Right: Room code chip + actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Room code — click to copy */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            aria-label="Sao chép mã phòng"
            className="hidden sm:inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border bg-muted font-mono text-xs font-bold tracking-widest text-foreground motion-safe:hover:bg-muted/80 transition-colors duration-(--duration-fast)"
          >
            <Hash className="size-3 text-muted-foreground" />
            <span>{currentRoom.code}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            aria-label="Sao chép link phòng"
            className="size-8"
          >
            <Link2 className="size-4" />
          </Button>

          {/* Desktop: Dock toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDockOpen((prev) => !prev)}
            aria-label={isDockOpen ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
            className="hidden lg:flex size-8"
          >
            {isDockOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </Button>

          {/* Mobile Sheet Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSheetOpen(true)}
            className="lg:hidden size-8"
            aria-label="Hàng chờ và Người xem"
          >
            <ListVideo className="size-4" />
          </Button>
        </div>
      </GlassSurface>

      {showClaim && !isHost && (
        <HostClaimBanner
          roomId={currentRoom.id}
          broadcastRoomEvent={() => broadcastRoomEvent({ action: 'host-claim' })}
        />
      )}

      {/* Main Zones Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 items-stretch min-h-0">
        {/* Left: Stage (Video Player) */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <SyncPlayer
            sourceType={currentRoom.source_type}
            sourceRef={currentRoom.source_ref}
            playerRef={playerRef}
            volume={watchPlayerVolume}
            onEnded={handleEnded}
            stageRef={stageRef}
            {...playerHandlers}
          >
            <RoomControls
              isHost={isHost}
              playerRef={playerRef}
              onSourceChange={() => setIsSourceModalOpen(true)}
              isFollowingHost={isFollowingHost}
              resync={resync}
              stageRef={stageRef}
              autoPlay={autoPlay}
              onAutoPlayToggle={() => setAutoPlay((prev) => !prev)}
              onVolumePreferenceChange={setWatchPlayerVolume}
              {...controlHandlers}
            />
            {needsGesture && <TapToPlayOverlay onResume={resumeFromGesture} />}
          </SyncPlayer>
        </div>

        {/* Right: Side Dock — collapsible desktop panel */}
        <div
          className={cn(
            'hidden lg:block shrink-0 min-h-0 overflow-hidden transition-[width,opacity] duration-(--duration-base) ease-fluid',
            isDockOpen ? 'w-80 opacity-100' : 'w-0 opacity-0',
          )}
        >
          <div className="w-80 min-h-0 h-full">
            <SideDock
              roomId={currentRoom.id}
              userId={userId}
              isHost={isHost}
              participants={participants}
              queueItems={queueItems}
              currentQueueItemId={currentRoom.current_queue_item_id}
              isMemberReady={membership.isMemberReady}
              profiles={profiles}
              broadcastQueueEvent={broadcastQueueEvent}
              broadcastRoomEvent={broadcastRoomEvent}
              messages={messages}
              sendChat={sendChat}
              onReact={sendReaction}
              reactionOverlayRef={reactionOverlayRef}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 border-l border-border flex flex-col h-full"
        >
          <SheetHeader className="p-4 border-b border-border shrink-0">
            <SheetTitle className="type-heading text-sm">Bảng điều khiển</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden min-h-0 p-2">
            <SideDock
              roomId={currentRoom.id}
              userId={userId}
              isHost={isHost}
              participants={participants}
              queueItems={queueItems}
              currentQueueItemId={currentRoom.current_queue_item_id}
              isMemberReady={membership.isMemberReady}
              profiles={profiles}
              broadcastQueueEvent={broadcastQueueEvent}
              broadcastRoomEvent={broadcastRoomEvent}
              messages={messages}
              sendChat={sendChat}
              onReact={sendReaction}
              reactionOverlayRef={reactionOverlayRef}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Source Change Dialog (Host only) */}
      {isHost ? (
        <SourceChangeDialog
          open={isSourceModalOpen}
          onOpenChange={setIsSourceModalOpen}
          newSourceType={newSourceType}
          setNewSourceType={setNewSourceType}
          newSourceRef={newSourceRef}
          setNewSourceRef={setNewSourceRef}
          roomId={currentRoom.id}
          queryClient={queryClient}
          broadcastRoomEvent={broadcastRoomEvent}
        />
      ) : null}
    </div>
  );
}
