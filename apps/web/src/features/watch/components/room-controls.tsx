'use client';

import React from 'react';
import { useMediaState, useMediaRemote } from '@vidstack/react';
import { Button, Slider, GlassSurface, Switch, cn } from '@pumni/ui';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Clapperboard, SkipForward } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pumni/ui';
import { useControlsVisibility } from '../hooks/use-controls-visibility';

interface RoomControlsProps {
  isHost: boolean;
  onSourceChange?: () => void;
  isFollowingHost?: boolean;
  resync?: () => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  autoPlay?: boolean;
  onAutoPlayToggle?: () => void;
  onAdvance?: () => void;
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

// ---------------------------------------------------------------------------
// Sub-components — presentational, receive all state as props
// ---------------------------------------------------------------------------

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
  onSeek: (values: number[]) => void;
  onSeekCommit: (values: number[]) => void;
}

function TimelineScrubber({ currentTime, duration, onSeek, onSeekCommit }: TimelineScrubberProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs font-mono text-foreground select-none tabular-nums min-w-9 text-right">
        {formatTime(currentTime)}
      </span>
      <Slider
        value={[currentTime]}
        min={0}
        max={duration || 100}
        step={0.1}
        onValueChange={onSeek}
        onValueCommit={onSeekCommit}
        className="flex-1 **:data-[slot=track]:bg-foreground/20 **:data-[slot=range]:bg-foreground **:data-[slot=thumb]:bg-foreground **:data-[slot=thumb]:border-foreground/30"
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

export function RoomControls({
  isHost,
  onSourceChange,
  isFollowingHost = true,
  resync,
  stageRef,
  autoPlay,
  onAutoPlayToggle,
  onAdvance,
}: RoomControlsProps) {
  const paused = useMediaState('paused');
  const muted = useMediaState('muted');
  const volume = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const playbackRate = useMediaState('playbackRate');
  const remote = useMediaRemote();

  // Controls Visibility auto-hide hook
  const { visible, controlsBind } = useControlsVisibility({ paused, stageRef });

  const handlePlayPause = () => {
    if (paused) {
      remote.play();
    } else {
      remote.pause();
    }
  };

  const handleSeek = (values: number[]) => {
    if (values[0] !== undefined) remote.seeking(values[0]);
  };

  const handleSeekCommit = (values: number[]) => {
    if (values[0] !== undefined) remote.seek(values[0]);
  };

  const handleVolumeChange = (values: number[]) => {
    if (values[0] !== undefined) remote.changeVolume(values[0]);
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
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onSeekCommit={handleSeekCommit}
        />

        {/* Control buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              aria-label={paused ? 'Play' : 'Pause'}
            >
              {paused ? (
                <Play className="size-4 fill-current text-foreground" />
              ) : (
                <Pause className="size-4 fill-current text-foreground" />
              )}
            </Button>

            {/* Volume Mute */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMuteToggle}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-4 text-foreground" />
              ) : (
                <Volume2 className="size-4 text-foreground" />
              )}
            </Button>

            {/* Volume slider */}
            <Slider
              value={[muted ? 0 : volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-20 **:data-[slot=track]:bg-foreground/20 **:data-[slot=range]:bg-foreground **:data-[slot=thumb]:bg-foreground **:data-[slot=thumb]:border-foreground/30"
              aria-label="Volume level"
            />

            {!isHost && isFollowingHost ? (
              <span className="type-caption text-muted-foreground ml-2 select-none">&bull; Đồng bộ</span>
            ) : null}
            {!isHost && !isFollowingHost ? (
              <span className="type-caption text-warning ml-2 select-none font-medium">
                &bull; Lệch sync
              </span>
            ) : null}
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
