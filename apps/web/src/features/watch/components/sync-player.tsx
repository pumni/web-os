'use client';

import { useMemo } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  isHLSProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaPlayEvent,
  type MediaPauseEvent,
  type MediaSeekedEvent,
  type MediaRateChangeEvent,
  type MediaEndedEvent,
} from '@vidstack/react';
import '@vidstack/react/player/styles/base.css';

interface SyncPlayerProps {
  sourceType: 'youtube' | 'url';
  sourceRef: string;
  playerRef: React.RefObject<MediaPlayerInstance | null>;
  onPlay?: (e: MediaPlayEvent) => void;
  onPause?: (e: MediaPauseEvent) => void;
  onSeeked?: (detail: number, e: MediaSeekedEvent) => void;
  onRateChange?: (detail: number, e: MediaRateChangeEvent) => void;
  onEnded?: (e: MediaEndedEvent) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
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
  onEnded,
  stageRef,
  children,
}: SyncPlayerProps) {
  const onProviderChange = (provider: MediaProviderAdapter | null) => {
    if (isHLSProvider(provider)) {
      provider.library = () => import('hls.js');
    }
  };

  // Memoize the source object so an unrelated re-render (presence sync, queue
  // update, control visibility) does not hand Vidstack a fresh object identity
  // and tear down + reload the provider mid-flight.
  const source = useMemo(() => {
    if (sourceType === 'youtube') {
      return {
        src: `https://www.youtube.com/watch?v=${sourceRef}`,
        type: 'video/youtube',
      } as const;
    }
    if (sourceRef.includes('.m3u8')) {
      return { src: sourceRef, type: 'application/x-mpegurl' } as const;
    }
    return { src: sourceRef, type: 'video/mp4' } as const;
  }, [sourceType, sourceRef]);

  return (
    <div
      ref={stageRef}
      /* bg-black is intentionally an inline style here — video stage requires
         absolute black (no semantic token covers it) and pumniNoRawColor
         correctly flags Tailwind `bg-black` in className. */
      style={{ backgroundColor: '#000' }}
      className="relative w-full aspect-video overflow-hidden rounded-xl border border-border shadow-sm"
    >
      <MediaPlayer
        ref={playerRef}
        src={source}
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
        onEnded={onEnded}
        className="w-full h-full"
      >
        <MediaProvider className="w-full h-full" />
        {children}
      </MediaPlayer>
    </div>
  );
}
