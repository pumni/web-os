'use client';

import * as React from 'react';
import { Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';

import { Window, Button, motion, useReducedMotion, cn } from '@pumni/ui';

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
  261.63,
  293.66,
  329.63,
  349.23,
  392.0, // Row 1: C4, D4, E4, F4, G4
  440.0,
  493.88,
  523.25,
  587.33,
  659.25, // Row 2: A4, B4, C5, D5, E5
  698.46,
  783.99,
  880.0,
  987.77,
  1046.5, // Row 3: F5, G5, A5, B5, C6
];

export function PreviewWindow({ className }: { className?: string }) {
  const [beat, setBeat] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const shouldReduce = useReducedMotion();

  // Helper function to synthesize sound chimes
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
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        NOTE_FREQS[index % NOTE_FREQS.length] ?? 261.63,
        ctx.currentTime,
      );

      // Simple volume envelope: instant attack, exponential release
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

  // Play beat notes automatically
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBeat((prevBeat) => {
        const nextBeat = (prevBeat + 1) % 8;
        if (!isMuted) {
          const notesToPlay = BEAT_PATTERNS[nextBeat] || [];
          notesToPlay.forEach((noteIdx) => playSound(noteIdx, 0.4));
        }
        return nextBeat;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, playSound]);

  const activeNotes = BEAT_PATTERNS[beat] || [];
  const progressPercent = ((beat + 1) / 8) * 100;

  const handleManualClick = (index: number) => {
    // Unmute temporarily for the manual click if muted
    playSound(index, 0.8);
  };

  return (
    <Window
      title="Sky Player - Playback Preview"
      className={cn(
        'w-full max-w-md shadow-2xl transition-all duration(--duration-base) hover:[box-shadow:var(--shadow-glass-glow)]',
        className,
      )}
      onClose={() => setIsPlaying(false)}
      onMinimize={() => setIsPlaying(false)}
      onMaximize={() => setIsPlaying(true)}
    >
      <div className="space-y-6">
        {/* Song info & controls */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Dawn (Sky COTL Theme)
            </h3>
            <p className="text-xs text-muted-foreground">JSON · skysheet · TXT compatible</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-md"
              aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 rounded-md"
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setBeat(0)}
              className="h-8 w-8 rounded-md"
              aria-label="Restart simulation"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 3x5 Music Note Grid */}
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
                whileHover={shouldReduce ? undefined : { scale: 1.12, y: -2 }}
                whileTap={shouldReduce ? undefined : { scale: 0.92 }}
                onClick={() => handleManualClick(index)}
                className={`aspect-square rounded-xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) border-(--glass-highlight) shadow-[0_0_15px_var(--primary)] scale-105'
                    : 'border-border bg-muted hover:bg-muted/80'
                }`}
                aria-label={`Note ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Playback progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) transition-all duration-(--duration-base) ease-fluid"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0:0{beat}</span>
            <span>0:08</span>
          </div>
        </div>

        {/* Stats metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted p-3 text-center transition-colors hover:bg-muted/80">
            <span className="block text-sm font-bold text-foreground">3 Formats</span>
            <span className="text-[10px] text-muted-foreground">JSON/TXT/Sheet</span>
          </div>
          <div className="rounded-lg border border-border bg-muted p-3 text-center transition-colors hover:bg-muted/80">
            <span className="block text-sm font-bold text-foreground">Windows</span>
            <span className="text-[10px] text-muted-foreground">PC Workflow</span>
          </div>
          <div className="rounded-lg border border-border bg-muted p-3 text-center transition-colors hover:bg-muted/80">
            <span className="block text-sm font-bold text-foreground">Open</span>
            <span className="text-[10px] text-muted-foreground">GitHub Source</span>
          </div>
        </div>
      </div>
    </Window>
  );
}
