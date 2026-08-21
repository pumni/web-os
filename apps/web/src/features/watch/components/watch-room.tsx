'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import { useRef, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import type { MediaPlayerInstance } from '@vidstack/react';
import { Badge, Spinner } from '@pumni/ui/feedback';
import { Button } from '@pumni/ui/form';
import { GlassSurface } from '@pumni/ui/identity';
import { toast } from 'sonner';
import { ArrowLeft, Hash, Link2, ListVideo, PanelRightClose, PanelRightOpen } from 'lucide-react';

import { leaveRoom } from '../actions';
import { useHostAutopromote } from '../hooks/use-host-autopromote';
import { useHostClaimState } from '../hooks/use-host-claim-state';
import { useMemberProfiles } from '../hooks/use-room-members';
import { useRoomChat } from '../hooks/use-room-chat';
import { useQueueActions } from '../hooks/use-queue-actions';
import { useSyncController } from '../hooks/use-sync-controller';
import { useWatchRoomRuntime } from '../hooks/use-watch-room-runtime';
import { useWatchVolumeStore } from '../stores/volume-store';
import type { QueueItem, Room } from '../types';
import { HostClaimBanner } from './host-claim-banner';
import type { ReactionOverlayRef } from './reaction-overlay';
import { RoomControls } from './room-controls';
import { SourceChangeDialog } from './source-change-dialog';
import { SyncIndicator } from './sync-indicator';
import { SyncPlayer } from './sync-player';
import { TapToPlayOverlay } from './tap-to-play-overlay';
import { WatchRoomDock } from './watch-room-dock';

interface WatchRoomProps {
  room: Room;
  userId: string;
  initialQueueItems: QueueItem[];
}

/**
 * Watch-room composition root.
 *
 * Base room infrastructure lives in `useWatchRoomRuntime`; queue/chat/sync stay
 * explicit here because their interaction is the product behavior this screen
 * coordinates. Presentational command/dock shells live in sibling components.
 */
export function WatchRoom({ room, userId, initialQueueItems }: WatchRoomProps) {
  const router = useRouter();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reactionOverlayRef = useRef<ReactionOverlayRef>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const watchPlayerVolume = useWatchVolumeStore((state) => state.watchPlayerVolume);
  const setWatchPlayerVolume = useWatchVolumeStore((state) => state.setWatchPlayerVolume);

  const {
    currentRoom,
    queueItems,
    isHost,
    membership,
    clockReady,
    serverClock,
    participants,
    events: roomEvents,
    broadcastQueueEvent,
    broadcastRoomEvent,
    channelStatus,
    broadcastAnchor,
    broadcastChat,
    broadcastReaction,
    broadcastMessageReaction,
  } = useWatchRoomRuntime({ room, userId, initialQueueItems });

  const queue = useQueueActions(currentRoom.id, {
    isMemberReady: membership.isMemberReady,
    currentQueueItemId: currentRoom.current_queue_item_id,
    broadcastQueueEvent,
    broadcastRoomEvent,
  });

  const { messages, sendChat, sendReaction, messageReactions, toggleMessageReaction } = useRoomChat(
    userId,
    broadcastChat,
    broadcastReaction,
    broadcastMessageReaction,
    roomEvents,
    (reaction) => reactionOverlayRef.current?.pushReaction(reaction),
  );

  useHostAutopromote(currentRoom.id, userId, isHost, participants, () =>
    broadcastRoomEvent({ action: 'host-claim' }),
  );

  const {
    syncStatus,
    isFollowingHost,
    needsGesture,
    resync,
    resumeFromGesture,
    playerHandlers,
    controlHandlers,
  } = useSyncController(playerRef, currentRoom, isHost, serverClock, roomEvents, broadcastAnchor);

  const { data: profiles = {} } = useMemberProfiles(participants.map((participant) => participant.userId));
  const hostPresent = participants.some((participant) => participant.isHost);
  const showClaim = useHostClaimState(isHost, hostPresent);

  const isAdvanceDisabled = (() => {
    if (queueItems.length === 0) return true;
    if (!currentRoom.current_queue_item_id) return false;

    const currentItem = queueItems.find((item) => item.id === currentRoom.current_queue_item_id);
    if (!currentItem) return false;

    return !queueItems.some((item) => item.position > currentItem.position);
  })();

  const handleEnded = () => {
    if (!isHost || !autoPlay || queueItems.length === 0) return;
    queue.advance({ silent: true });
  };

  const handleAdvance = () => {
    if (!membership.isMemberReady) return;
    if (queueItems.length === 0) {
      toast.error('Hàng chờ đã hết. Vui lòng thêm video mới.');
      return;
    }
    queue.advance();
  };

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
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <GlassSurface
          variant="panel"
          className="flex w-full max-w-xs flex-col items-center justify-center gap-4 rounded-xl px-8 py-10 select-none"
        >
          <Spinner size="lg" />
          <span className="type-caption text-muted-foreground">Đang đồng bộ với máy chủ...</span>
        </GlassSurface>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 select-none">
      <GlassSurface
        variant="bar"
        className="flex w-full shrink-0 items-center justify-between rounded-xl px-3 py-2 select-none"
      >
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

          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate type-heading text-sm">Phòng xem chung</h2>
            <SyncIndicator status={syncStatus} />
            {channelStatus !== 'connected' && (
              <Badge
                tone="destructive"
                size="sm"
                role="status"
                aria-live="polite"
                className="hidden motion-safe:animate-pulse sm:inline-flex"
              >
                Mất kết nối
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            aria-label="Sao chép mã phòng"
            className="hidden h-7 items-center gap-1 rounded-md border border-border bg-card state-hover px-2.5 font-mono text-xs font-bold tracking-widest text-foreground surface-raised transition-colors duration-(--duration-fast) sm:inline-flex"
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDockOpen((open) => !open)}
            aria-label={isDockOpen ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
            className="hidden size-8 lg:flex"
          >
            {isDockOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSheetOpen(true)}
            className="size-8 lg:hidden"
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

      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-y-4 lg:flex-row lg:gap-x-0">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
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
              onAutoPlayToggle={() => setAutoPlay((enabled) => !enabled)}
              onAdvance={handleAdvance}
              isAdvanceDisabled={isAdvanceDisabled}
              onVolumePreferenceChange={setWatchPlayerVolume}
              {...controlHandlers}
            />
            {needsGesture && <TapToPlayOverlay onResume={resumeFromGesture} />}
          </SyncPlayer>
        </div>

        <WatchRoomDock
          desktopOpen={isDockOpen}
          mobileOpen={isSheetOpen}
          onMobileOpenChange={setIsSheetOpen}
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
          messageReactions={messageReactions}
          onReactMessage={toggleMessageReaction}
          onPlayItem={(item) => queue.play(item)}
          reactionOverlayRef={reactionOverlayRef}
        />
      </div>

      {isHost ? (
        <SourceChangeDialog
          open={isSourceModalOpen}
          onOpenChange={setIsSourceModalOpen}
          roomId={currentRoom.id}
          broadcastRoomEvent={broadcastRoomEvent}
        />
      ) : null}
    </div>
  );
}
