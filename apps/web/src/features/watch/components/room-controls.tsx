"use client";

import React from "react";
import { useMediaState, useMediaRemote } from "@vidstack/react";
import { Button, Slider, GlassSurface, cn } from "@pumni/ui";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pumni/ui";
import { useControlsVisibility } from "../hooks/use-controls-visibility";

interface RoomControlsProps {
  isHost: boolean;
  onSourceChange?: () => void;
  isFollowingHost?: boolean;
  resync?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

export function RoomControls({ 
  isHost, 
  onSourceChange,
  isFollowingHost = true,
  resync
}: RoomControlsProps) {
  const paused = useMediaState("paused");
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const fullscreen = useMediaState("fullscreen");
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const playbackRate = useMediaState("playbackRate");
  const remote = useMediaRemote();

  // Controls Visibility auto-hide hook
  const { visible, controlsBind } = useControlsVisibility({ paused });

  const handlePlayPause = () => {
    // Both host and follower can interact. Manual changes will soft-lock sync.
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
    if (!isHost) return; // Playback rate remains host-only authoritative
    const speed = parseFloat(value);
    if (!isNaN(speed)) {
      remote.changePlaybackRate(speed);
    }
  };

  return (
    <>
      <div 
        style={{
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(0, 0, 0, 0) 100%)"
        }}
        className={cn(
          "absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )} 
      />

      <GlassSurface 
        onMouseEnter={controlsBind.onMouseEnter}
        onMouseLeave={controlsBind.onMouseLeave}
        onFocus={controlsBind.onFocus}
        onBlur={controlsBind.onBlur}
        className={cn(
          "glass-bar absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2 p-3 border border-glass-border rounded-xl shadow-lg transition-all duration-300",
          visible ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
        )}
      >
        {/* Soft-lock alert banner for follower */}
        {!isHost && !isFollowingHost && resync && (
          <div className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg border border-warning/20 bg-warning/5 text-warning text-xs select-none">
            <span>Bạn đang xem lệch tiến trình phát của phòng.</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resync} 
              className="h-6 text-[10px] px-2.5 font-semibold hover:bg-warning/10 text-warning border border-warning/20"
            >
              Đồng bộ lại
            </Button>
          </div>
        )}

        {/* Timeline progress slider */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-mono text-foreground/80 select-none">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeekCommit}
            className="flex-1"
            aria-label="Seek progress"
          />
          <span className="text-xs font-mono text-foreground/80 select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              aria-label={paused ? "Play" : "Pause"}
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
              aria-label={muted ? "Unmute" : "Mute"}
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
              className="w-20"
              aria-label="Volume level"
            />

            {!isHost && isFollowingHost && (
              <span className="text-[10px] text-muted-foreground/80 ml-2 select-none">
                Đang đồng bộ với Host
              </span>
            )}
            {!isHost && !isFollowingHost && (
              <span className="text-[10px] text-warning/80 ml-2 select-none font-medium">
                Đã ngắt đồng bộ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Source Change Button (Host only) */}
            {isHost && onSourceChange && (
              <Button variant="ghost" size="sm" onClick={onSourceChange} className="text-xs">
                Đổi nguồn phát
              </Button>
            )}

            {/* Playback Rate / Speed Selector */}
            <div className="flex items-center gap-1">
              <Gauge className="size-3.5 text-muted-foreground" />
              <Select
                value={playbackRate.toString()}
                onValueChange={handleSpeedChange}
                disabled={!isHost}
              >
                <SelectTrigger className="h-7 w-20 text-[11px] px-2">
                  <SelectValue placeholder="Tốc độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1.0x (Chuẩn)</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2.0x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreenToggle}
              aria-label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {fullscreen ? (
                <Minimize className="size-4 text-foreground" />
              ) : (
                <Maximize className="size-4 text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </GlassSurface>
    </>
  );
}
