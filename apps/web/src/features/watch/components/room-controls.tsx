'use client';

import React from 'react';
import { useMediaState, useMediaRemote, type MediaPlayerInstance } from '@vidstack/react';
import { Button, Slider, GlassSurface, Switch, cn } from '@pumni/ui';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Clapperboard, SkipForward } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pumni/ui';
import { useControlsVisibility } from '../hooks/use-controls-visibility';

interface RoomControlsProps {
  isHost: boolean;
  playerRef?: React.RefObject<MediaPlayerInstance | null>;
  onSourceChange?: () => void;
  isFollowingHost?: boolean;
  resync?: () => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  autoPlay?: boolean;
  onAutoPlayToggle?: () => void;
  onAdvance?: () => void;
  onVolumePreferenceChange?: (volume: number) => void;
  onPlayPauseIntent?: () => void;
  onSeekCommitIntent?: (time: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(time) || time < 0) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return time;
  return Math.min(time, duration);
}

function useSmoothTimelineTime({
  currentTime,
  duration,
  paused,
  playbackRate,
  playerRef,
  isScrubbing,
}: {
  currentTime: number;
  duration: number;
  paused: boolean;
  playbackRate: number;
  playerRef?: React.RefObject<MediaPlayerInstance | null>;
  isScrubbing: boolean;
}) {
  const [displayTime, setDisplayTime] = React.useState(() => clampTime(currentTime, duration));
  const anchorRef = React.useRef({ mediaTime: currentTime, timestamp: 0 });

  React.useEffect(() => {
    const nextTime = clampTime(currentTime, duration);
    anchorRef.current = { mediaTime: nextTime, timestamp: performance.now() };
    if (isScrubbing) return;

    const frameId = requestAnimationFrame(() => setDisplayTime(nextTime));
    return () => cancelAnimationFrame(frameId);
  }, [currentTime, duration, isScrubbing]);

  React.useEffect(() => {
    if (isScrubbing || paused || playbackRate <= 0) return;

    let frameId = 0;
    const tick = (timestamp: number) => {
      const anchor = anchorRef.current;
      const elapsedSeconds = Math.max(0, (timestamp - anchor.timestamp) / 1000);
      const playerTime = playerRef?.current?.currentTime;
      const interpolatedTime = anchor.mediaTime + elapsedSeconds * playbackRate;
      const hasStablePlayerTime =
        playerTime !== undefined &&
        Number.isFinite(playerTime) &&
        Math.abs(playerTime - interpolatedTime) < 1;
      const nextTime = clampTime(
        hasStablePlayerTime
          ? Math.max(playerTime, interpolatedTime)
          : interpolatedTime,
        duration,
      );

      setDisplayTime((previousTime) =>
        Math.abs(previousTime - nextTime) >= 0.01 ? nextTime : previousTime,
      );
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, isScrubbing, paused, playbackRate, playerRef]);

  return displayTime;
}

// ---------------------------------------------------------------------------
// Sub-components — presentational, receive all state as props
// ---------------------------------------------------------------------------

function PlayPauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-label={paused ? 'Play' : 'Pause'}
    >
      {paused ? (
        <Play className="size-4 fill-current text-foreground" />
      ) : (
        <Pause className="size-4 fill-current text-foreground" />
      )}
    </Button>
  );
}

// fallow-ignore-next-line complexity
function VolumeControl({
  muted,
  volume,
  onMuteToggle,
  onVolumeChange,
}: {
  muted: boolean;
  volume: number;
  onMuteToggle: () => void;
  onVolumeChange: (values: number[]) => void;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted || volume === 0 ? (
          <VolumeX className="size-4 text-foreground" />
        ) : (
          <Volume2 className="size-4 text-foreground" />
        )}
      </Button>
      <Slider
        value={[muted ? 0 : volume]}
        min={0}
        max={1}
        step={0.05}
        onValueChange={onVolumeChange}
        className="w-20 **:data-[slot=track]:bg-foreground/20 **:data-[slot=range]:bg-foreground **:data-[slot=thumb]:bg-foreground **:data-[slot=thumb]:border-foreground/30"
        aria-label="Volume level"
      />
    </>
  );
}

function SyncStatusBadge({
  isHost,
  isFollowingHost,
}: {
  isHost: boolean;
  isFollowingHost: boolean;
}) {
  if (isHost) return null;
  if (isFollowingHost) {
    return (
      <span className="type-caption text-muted-foreground ml-2 select-none">
        &bull; Đồng bộ
      </span>
    );
  }
  return (
    <span className="type-caption text-warning ml-2 select-none font-medium">
      &bull; Lệch sync
    </span>
  );
}

function SoftLockBanner({ onResync }: { onResync: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between w-full px-3 py-1.5 rounded-md border border-warning/20 bg-warning/10 text-warning text-xs select-none"
    >
      <span className="leading-snug">Bạn đang xem lệch tiến trình của phòng.</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onResync}
        className="h-6 text-xs px-2.5 font-semibold motion-safe:hover:bg-warning/10 text-warning border border-warning/20 shrink-0 ml-2"
      >
        Đồng bộ lại
      </Button>
    </div>
  );
}

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  seekPreview: number | null;
  onSeekPreview: (values: number[]) => void;
  onSeekCommit: (values: number[]) => void;
}

function TimelineScrubber({
  currentTime,
  duration,
  seekPreview,
  onSeekPreview,
  onSeekCommit,
}: TimelineScrubberProps) {
  const sliderValue = seekPreview ?? currentTime;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs font-mono text-foreground select-none tabular-nums min-w-9 text-right">
        {formatTime(sliderValue)}
      </span>
      <Slider
        value={[sliderValue]}
        min={0}
        max={duration || 100}
        step={0.1}
        onValueChange={onSeekPreview}
        onValueCommit={onSeekCommit}
        className="flex-1 **:data-[slot=track]:bg-foreground/20 **:data-[slot=range]:bg-foreground **:data-[slot=thumb]:bg-foreground **:data-[slot=thumb]:border-border"
        aria-label="Seek progress"
      />
      <span className="text-xs font-mono text-muted-foreground select-none tabular-nums min-w-9">
        {formatTime(duration)}
      </span>
    </div>
  );
}

interface HostActionGroupProps {
  isHost: boolean;
  playbackRate: number;
  fullscreen: boolean;
  autoPlay?: boolean;
  onSourceChange?: () => void;
  onAutoPlayToggle?: () => void;
  onAdvance?: () => void;
  onSpeedChange: (value: string) => void;
  onFullscreenToggle: () => void;
}

// fallow-ignore-next-line complexity
function HostActionGroup({
  isHost,
  playbackRate,
  fullscreen,
  autoPlay,
  onSourceChange,
  onAutoPlayToggle,
  onAdvance,
  onSpeedChange,
  onFullscreenToggle,
}: HostActionGroupProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Source Change Button (Host only) */}
      {isHost && onSourceChange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSourceChange}
          aria-label="Đổi nguồn phát"
          className="size-8 text-muted-foreground motion-safe:hover:text-foreground"
        >
          <Clapperboard className="size-4" />
        </Button>
      )}

      {/* Playback Rate / Speed Selector — host only authoritative */}
      <Select
        value={playbackRate.toString()}
        onValueChange={onSpeedChange}
        disabled={!isHost}
      >
        <SelectTrigger className="h-7 w-14 text-xs px-1.5 bg-transparent border-foreground/20 text-foreground focus:ring-foreground/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">0.5×</SelectItem>
          <SelectItem value="0.75">0.75×</SelectItem>
          <SelectItem value="1">1×</SelectItem>
          <SelectItem value="1.25">1.25×</SelectItem>
          <SelectItem value="1.5">1.5×</SelectItem>
          <SelectItem value="2">2×</SelectItem>
        </SelectContent>
      </Select>

      {/* Auto-play Toggle */}
      {isHost && onAutoPlayToggle && (
        <div className="flex items-center gap-1.5">
          <span className="type-caption text-muted-foreground select-none whitespace-nowrap">
            Tự động phát
          </span>
          <Switch
            checked={autoPlay}
            onCheckedChange={onAutoPlayToggle}
            aria-label="Tự động phát video tiếp theo"
          />
        </div>
      )}

      {/* Skip to next video (host only) */}
      {isHost && onAdvance && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onAdvance}
          aria-label="Phát video tiếp theo"
          className="size-8 text-muted-foreground motion-safe:hover:text-foreground"
          title="Video tiếp theo"
        >
          <SkipForward className="size-4" />
        </Button>
      )}

      {/* Fullscreen */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreenToggle}
        aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        className="size-8 text-muted-foreground motion-safe:hover:text-foreground"
      >
        {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoomControls
// ---------------------------------------------------------------------------

// fallow-ignore-next-line complexity
export function RoomControls({
  isHost,
  playerRef,
  onSourceChange,
  isFollowingHost = true,
  resync,
  stageRef,
  autoPlay,
  onAutoPlayToggle,
  onAdvance,
  onVolumePreferenceChange,
  onPlayPauseIntent,
  onSeekCommitIntent,
}: RoomControlsProps) {
  const paused = useMediaState('paused');
  const muted = useMediaState('muted');
  const volume = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const playbackRate = useMediaState('playbackRate');
  const remote = useMediaRemote();
  const [seekPreview, setSeekPreview] = React.useState<number | null>(null);
  const timelineTime = useSmoothTimelineTime({
    currentTime,
    duration,
    paused,
    playbackRate,
    playerRef,
    isScrubbing: seekPreview !== null,
  });

  // Controls Visibility auto-hide hook
  const { visible, controlsBind } = useControlsVisibility({ paused, stageRef });

  const handlePlayPause = () => {
    onPlayPauseIntent?.();
    if (paused) {
      remote.play();
    } else {
      remote.pause();
    }
  };

  const seekTo = (time: number) => {
    remote.seeking(time);
    remote.seek(time);
    if (playerRef?.current) {
      playerRef.current.currentTime = time;
    }
  };

  const handleSeekPreview = (values: number[]) => {
    const nextTime = values[0];
    if (nextTime === undefined) return;
    setSeekPreview(nextTime);
    remote.seeking(nextTime);
  };

  const handleSeekCommit = (values: number[]) => {
    const nextTime = values[0];
    if (nextTime === undefined) return;
    setSeekPreview(null);
    seekTo(nextTime);
    onSeekCommitIntent?.(nextTime);
  };

  const handleVolumeChange = (values: number[]) => {
    const nextVolume = values[0];
    if (nextVolume === undefined) return;
    remote.changeVolume(nextVolume);
    onVolumePreferenceChange?.(nextVolume);
  };

  const handleMuteToggle = () => {
    if (muted) {
      remote.unmute();
    } else {
      remote.mute();
    }
  };

  const handleFullscreenToggle = () => {
    if (fullscreen) {
      remote.exitFullscreen();
    } else {
      remote.enterFullscreen();
    }
  };

  const handleSpeedChange = (value: string) => {
    if (!isHost) return;
    const speed = parseFloat(value);
    if (!isNaN(speed)) {
      remote.changePlaybackRate(speed);
    }
  };

  return (
    <>
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10 transition-opacity duration-(--duration-base) ease-fluid',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'linear-gradient(to top, var(--color-overlay) 0%, color-mix(in oklch, var(--color-overlay) 45%, transparent) 55%, transparent 100%)',
        }}
      />

      <GlassSurface
        variant="panel"
        onMouseEnter={controlsBind.onMouseEnter}
        onMouseLeave={controlsBind.onMouseLeave}
        onFocus={controlsBind.onFocus}
        onBlur={controlsBind.onBlur}
        className={cn(
          'absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2 p-3 rounded-nested transition-all duration-(--duration-base) ease-fluid',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2',
        )}
      >
        {/* Soft-lock alert banner for follower */}
        {!isHost && !isFollowingHost && resync ? (
          <SoftLockBanner onResync={resync} />
        ) : null}

        <TimelineScrubber
          currentTime={timelineTime}
          duration={duration}
          seekPreview={seekPreview}
          onSeekPreview={handleSeekPreview}
          onSeekCommit={handleSeekCommit}
        />

        {/* Control buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <PlayPauseButton paused={paused} onToggle={handlePlayPause} />
            <VolumeControl
              muted={muted}
              volume={volume}
              onMuteToggle={handleMuteToggle}
              onVolumeChange={handleVolumeChange}
            />
            <SyncStatusBadge isHost={isHost} isFollowingHost={isFollowingHost} />
          </div>

          <HostActionGroup
            isHost={isHost}
            playbackRate={playbackRate}
            fullscreen={fullscreen}
            autoPlay={autoPlay}
            onSourceChange={onSourceChange}
            onAutoPlayToggle={onAutoPlayToggle}
            onAdvance={onAdvance}
            onSpeedChange={handleSpeedChange}
            onFullscreenToggle={handleFullscreenToggle}
          />
        </div>
      </GlassSurface>
    </>
  );
}
