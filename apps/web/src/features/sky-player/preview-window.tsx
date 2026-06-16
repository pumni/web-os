'use client';

import * as React from 'react';
import Link from 'next/link';
import { Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';

import {
  Window,
  Button,
  motion,
  AnimatePresence,
  recipes,
  useReducedMotion,
  cn,
} from '@pumni/ui';

// Define note activation patterns for 8 beats in a loop
const BEAT_PATTERNS: Record<number, number[]> = {
  0: [0, 4, 8, 12],
  1: [2, 6, 10],
  2: [1, 5, 9, 13],
  3: [3, 7, 11, 14],
  4: [0, 5, 10],
  5: [2, 7, 12],
  6: [1, 6, 11],
  7: [3, 4, 8, 13],
};

// C Major scale frequencies for the 15-key grid
const NOTE_FREQS = [
  261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99,
  880.0, 987.77, 1046.5,
];

// Sky instrument key labels (row-major 3×5 grid)
const NOTE_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W', 'E', 'R', 'T'];

type PreviewWindowProps = {
  className?: string;
  showLearnMore?: boolean;
  /** Subtle float animation for hero placement */
  elevated?: boolean;
};

export function PreviewWindow({
  className,
  showLearnMore = false,
}: PreviewWindowProps) {
  const [beat, setBeat] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const shouldReduce = useReducedMotion();

  const playSound = React.useCallback((index: number, volumeFactor = 1) => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        NOTE_FREQS[index % NOTE_FREQS.length] ?? 261.63,
        ctx.currentTime,
      );

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12 * volumeFactor, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('Could not play note audio:', err);
    }
  }, []);

  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBeat((prevBeat) => {
        const nextBeat = (prevBeat + 1) % 8;
        if (!isMuted) {
          const notesToPlay = BEAT_PATTERNS[nextBeat] ?? [];
          notesToPlay.forEach((noteIdx) => playSound(noteIdx, 0.4));
        }
        return nextBeat;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, playSound]);

  const activeNotes = BEAT_PATTERNS[beat] ?? [];
  const progressPercent = ((beat + 1) / 8) * 100;

  const handleManualClick = (index: number) => {
    playSound(index, 0.8);
  };

  const noteMotion = shouldReduce ? {} : { ...recipes.hoverLift, ...recipes.pressScale };

  return (
    <div className={cn('space-y-3 w-full flex flex-col justify-between', className)}>
      <Window
        title="Sky Player - Playback Preview"
        className="w-full flex-1 shadow-raised transition-all duration-(--duration-base) hover:[box-shadow:var(--shadow-glass-glow)]"
        onClose={() => setIsPlaying(false)}
        onMinimize={() => setIsPlaying(false)}
        onMaximize={() => setIsPlaying(true)}
      >
        <div className="space-y-6 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="type-heading text-foreground">
                Dawn (Sky COTL Theme)
              </h3>
              <p className="text-xs text-muted-foreground">Interactive playback preview</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setBeat(0)}
                aria-label="Restart simulation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="grid grid-cols-5 gap-3"
            role="grid"
            aria-label="Interactive Sky Music keyboard"
          >
            {Array.from({ length: 15 }).map((_, index) => {
              const isActive = activeNotes.includes(index);
              return (
                <motion.button
                  key={index}
                  type="button"
                  {...noteMotion}
                  onClick={() => handleManualClick(index)}
                  className={cn(
                    'relative aspect-square rounded-xl border transition-colors duration-(--duration-base) ease-fluid',
                    isActive
                      ? 'border-(--glass-highlight) bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) shadow-[0_0_15px_var(--primary)]'
                      : 'border-border bg-muted hover:bg-muted/80',
                  )}
                  aria-label={`Note ${NOTE_LABELS[index]}`}
                >
                  <span
                    className={cn(
                      'absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {NOTE_LABELS[index]}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPlaying ? 'playing' : 'paused'}
                  initial={shouldReduce ? false : { opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'h-full bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) transition-all duration-(--duration-base) ease-fluid',
                    isPlaying && !shouldReduce && 'motion-safe:animate-pulse',
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </AnimatePresence>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0:0{beat}</span>
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
              <span>0:08</span>
            </div>
          </div>
        </div>
      </Window>
      {showLearnMore ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/sky-player"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Learn more about Sky Player
          </Link>
        </p>
      ) : null}
    </div>
  );
}
