'use client';

import * as React from 'react';
import { GlassSurface } from '@pumni/ui/identity';
import { cn } from '@/shared/lib/utils';

/**
 * Backdrop presets for the Glassmorphism 2.0 playground.
 *
 * Each preset renders a colourful backdrop that a glass surface can refract
 * (ADR-0012 backdrop precondition). The presets differ in dominant hue so
 * the *background-reactive tint* technique has something reactive to react
 * to — coral blobs push the tint warm, cyan/indigo blobs push it cool.
 */
export type BackdropPreset = 'photo' | 'blob' | 'image2' | 'textured' | 'off';

const PRESETS: { value: BackdropPreset; label: string }[] = [
  { value: 'photo', label: 'mp_bg.jpg' },
  { value: 'blob', label: '2-blob canonical' },
  { value: 'image2', label: 'Coral + Amber' },
  { value: 'textured', label: 'Textured (Orizon #6)' },
  { value: 'off', label: 'Tắt (flat)' },
];

export { PRESETS as BACKDROP_PRESETS };

/** Render a backdrop preset as an absolutely-positioned layer. */
export function GlassBackdrop({
  preset,
  className,
}: {
  preset: BackdropPreset;
  className?: string;
}) {
  if (preset === 'off') {
    return <div aria-hidden className={cn('absolute inset-0 bg-background', className)} />;
  }
  if (preset === 'photo') {
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0 bg-cover bg-center', className)}
        style={{ backgroundImage: 'url(/mp_bg.jpg)' }}
      />
    );
  }
  if (preset === 'image2') {
    // Coral → Amber gradient built from the semantic blob tokens (NOT the
    // primitive `--coral-*` / `--amber-*` indirection, which the app layer is
    // forbidden from referencing directly per design-system.md).
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0', className)}
        style={{
          backgroundImage:
            'linear-gradient(120deg, var(--desktop-blob-primary) 0%, var(--desktop-blob-secondary) 100%)',
        }}
      />
    );
  }
  if (preset === 'textured') {
    // Textured backdrop — Orizon rule #6 "Test against five extremes" lists
    // "textured" as one of the five. We composite a faint SVG noise turbulence
    // over the canonical 2-blob container so the playground can show how a
    // glass surface handles noisy backgrounds (which can leak through blur
    // and destabilise text contrast).
    return (
      <div aria-hidden className={cn('absolute inset-0 overflow-hidden', className)}>
        <div
          className="absolute -top-1/4 -left-1/4 size-2/3 rounded-full opacity-50 blur-3xl"
          style={{ backgroundColor: 'var(--desktop-blob-primary)' }}
        />
        <div
          className="absolute right-0 bottom-0 size-2/3 rounded-full opacity-55 blur-3xl"
          style={{ backgroundColor: 'var(--desktop-blob-secondary)' }}
        />
        {/* SVG feTurbulence baseFrequency 0.9 = fine grain; opacity 12%
            keeps the texture a hint, not a competing layer. The
            feColorMatrix saturate=0 desaturates the noise to grayscale so
            the texture adds high-frequency variation without shifting hue. */}
        <svg className="absolute inset-0 size-full opacity-12" aria-hidden>
          <filter id="glass-textured-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#glass-textured-noise)" />
        </svg>
        <div className="absolute inset-0 bg-muted/30" />
      </div>
    );
  }
  // Canonical 2-blob container per design-system.md feature-glass pattern.
  return (
    <div aria-hidden className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        className="absolute -top-1/4 -left-1/4 size-2/3 rounded-full opacity-50 blur-3xl"
        style={{ backgroundColor: 'var(--desktop-blob-primary)' }}
      />
      <div
        className="absolute right-0 bottom-0 size-2/3 rounded-full opacity-55 blur-3xl"
        style={{ backgroundColor: 'var(--desktop-blob-secondary)' }}
      />
      <div className="absolute inset-0 bg-muted/30" />
    </div>
  );
}

/**
 * Liquid Glass card — 2026 refraction technique.
 *
 * Unlike `CardSpotlight` (a colour-only radial overlay), this wrapper
 * increases the *local* `backdrop-filter` blur at the cursor by injecting a
 * second `::before` layer with its own backdrop-filter following the
 * pointer. The result reads as "the glass bends light more strongly where you
 * look" — Liquid Glass per the 2026 Lucky Graphics description.
 *
 * `--spot-x` / `--spot-y` are read by the consumer's `::before` pseudo layer
 * (defined via inline style here to keep it self-contained inside the
 * playground demo, NOT inside `glass.css` — this is a teaching showcase, not
 * a production utility).
 */
export function LiquidGlassCard({
  className,
  children,
  enabled,
  style,
  ...props
}: React.ComponentProps<'div'> & { enabled: boolean }) {
  const rectRef = React.useRef<DOMRect | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const pendingRef = React.useRef<{ x: number; y: number } | null>(null);
  const [spot, setSpot] = React.useState<{ x: string; y: string } | null>(null);

  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    rectRef.current = e.currentTarget.getBoundingClientRect();
  };
  const handleLeave = () => {
    rectRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
    setSpot(null);
  };
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    pendingRef.current = { x: e.clientX, y: e.clientY };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const p = pendingRef.current;
      if (!p || !rectRef.current) return;
      pendingRef.current = null;
      const rect = rectRef.current;
      const x = ((p.x - rect.left) / rect.width) * 100;
      const y = ((p.y - rect.top) / rect.height) * 100;
      setSpot({ x: `${x}%`, y: `${y}%` });
    });
  };

  // When disabled, render a plain glass-shell div (no extra backdrop-filter
  // layer — the perf discipline is "no animated backdrop-filter" — this is a
  // localised second reader, not a transition).
  if (!enabled) {
    return (
      <GlassSurface
        variant="panel"
        className={cn('relative overflow-hidden', className)}
        style={style}
        {...props}
      >
        {children}
      </GlassSurface>
    );
  }

  const layerStyle: React.CSSProperties = {
    ['--liquid-blur' as string]: '20px',
    ['--liquid-size' as string]: '180px',
    ['--liquid-x' as string]: spot?.x ?? '50%',
    ['--liquid-y' as string]: spot?.y ?? '50%',
    ...style,
  };

  return (
    <GlassSurface
      variant="panel"
      className={cn('relative overflow-hidden', className)}
      style={layerStyle}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...props}
    >
      {/* Liquid refraction layer — a second backdrop-filter reading the SAME
       * backdrop but with a stronger blur, masked to a soft circle that
       * follows the cursor. `pointer-events: none` preserves click-through. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: 'blur(var(--liquid-blur))',
          WebkitBackdropFilter: 'blur(var(--liquid-blur))',
          WebkitMaskImage: `radial-gradient(var(--liquid-size) circle at var(--liquid-x) var(--liquid-y), black 30%, transparent 70%)`,
          maskImage: `radial-gradient(var(--liquid-size) circle at var(--liquid-x) var(--liquid-y), black 30%, transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </GlassSurface>
  );
}
