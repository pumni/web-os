"use client";

import { useCallback } from "react";
import {
  MediaPlayer,
  MediaProvider,
  isHLSProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";

interface SyncPlayerProps {
  sourceType: "youtube" | "url";
  sourceRef: string;
  playerRef: React.RefObject<MediaPlayerInstance | null>;
  onPlay?: () => void;
  onPause?: () => void;
  onSeeked?: () => void;
  onRateChange?: () => void;
  children?: React.ReactNode;
}

export function SyncPlayer({
  sourceType,
  sourceRef,
  playerRef,
  onPlay,
  onPause,
  onSeeked,
  onRateChange,
  children,
}: SyncPlayerProps) {
  const onProviderChange = useCallback((provider: MediaProviderAdapter | null) => {
    if (isHLSProvider(provider)) {
      provider.library = () => import("hls.js");
    }
  }, []);

  const src = sourceType === "youtube"
    ? `https://www.youtube.com/watch?v=${sourceRef}`
    : sourceRef;

  const type = sourceType === "youtube"
    ? "video/youtube"
    : sourceRef.includes(".m3u8")
      ? "application/x-mpegurl"
      : "video/mp4";

  return (
    <div
      className="relative w-full aspect-video overflow-hidden rounded-xl border border-border/20 shadow-2xl"
      style={{ backgroundColor: "black" }}
    >
      <MediaPlayer
        ref={playerRef}
        src={{ src, type }}
        crossOrigin="anonymous"
        playsInline
        keyTarget="document"
        load="eager"
        controls={false} // We build our own control bar
        onProviderChange={onProviderChange}
        onPlay={onPlay}
        onPause={onPause}
        onSeeked={onSeeked}
        onRateChange={onRateChange}
        className="w-full h-full"
      >
        <MediaProvider className="w-full h-full" />
        {children}
      </MediaPlayer>
    </div>
  );
}

