'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Backdrop presets for the Glassmorphism playground.
 *
 * Rewritten exclusively from glassmorphism-card-laboratory:
 *   • "Floating Orbs" — violet/cyan/rose animated orbs (motion.div simulation via CSS animation)
 *   • "Mesh Gradient" — radial mesh gradient
 *   • "HD Wallpaper" — abstract wallpaper image
 *
 * Three ambient wallpaper presets matching the Lab's BACKGROUND_PRESETS:
 *   • "Cosmic Obsidian" — deep indigo/black (#0f0c20 → #1a103c → #0a0718)
 *   • "Sunset Ember"    — vibrant rose/magenta (#eb4b64 → #b5179e → #7209b7)
 *   • "Aurora Borealis" — teal/cyan/navy (#1ebea5 → #0077b6 → #03045e)
 */

export type BackdropStyle = 'orbs' | 'gradient' | 'image';

export interface AmbientPreset {
  id: string;
  name: string;
  description: string;
  /** Dominant RGB for APCA contrast calculation (matching Lab's preset.rgb). */
  rgb: { r: number; g: number; b: number };
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'cosmic',
    name: 'Cosmic Obsidian',
    description: 'Deep, rich cosmic nebula with indigo and black hues',
    rgb: { r: 15, g: 12, b: 32 },
    gradientFrom: '#0f0c20',
    gradientVia: '#1a103c',
    gradientTo: '#0a0718',
  },
  {
    id: 'sunset',
    name: 'Sunset Ember',
    description: 'Vibrant high-energy sunset rose and magenta gradient',
    rgb: { r: 235, g: 75, b: 100 },
    gradientFrom: '#eb4b64',
    gradientVia: '#b5179e',
    gradientTo: '#7209b7',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Glowing polar teal, emerald, and electric cyan mix',
    rgb: { r: 30, g: 190, b: 165 },
    gradientFrom: '#1ebea5',
    gradientVia: '#0077b6',
    gradientTo: '#03045e',
  },
];

export const BACKDROP_PRESETS: { value: BackdropStyle; label: string }[] = [
  { value: 'orbs', label: 'Floating Orbs' },
  { value: 'gradient', label: 'Mesh Gradient' },
  { value: 'image', label: 'HD Wallpaper' },
];

interface GlassBackdropProps {
  style: BackdropStyle;
  preset: AmbientPreset;
  className?: string;
}

/** Render the animated backdrop layer inside the simulation stage. */
export function GlassBackdrop({ style, preset, className }: GlassBackdropProps) {
  const bg = `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientVia}, ${preset.gradientTo})`;

  if (style === 'orbs') {
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
        style={{ background: bg }}
      >
        {/* Huge vibrating violet orb */}
        <div
          className="absolute w-72 h-72 rounded-full mix-blend-screen blur-3xl -top-10 -left-10 animate-glass-orb-1"
          style={{ background: 'oklch(0.55 0.28 290 / 0.40)' }}
        />
        {/* Hyper-vibrant cyan/emerald orb */}
        <div
          className="absolute w-80 h-80 rounded-full mix-blend-screen blur-3xl top-1/3 -right-10 animate-glass-orb-2"
          style={{ background: 'oklch(0.68 0.22 195 / 0.35)' }}
        />
        {/* Fiery rose orb */}
        <div
          className="absolute w-64 h-64 rounded-full mix-blend-screen blur-2xl -bottom-10 left-1/3 animate-glass-orb-3"
          style={{ background: 'oklch(0.62 0.26 350 / 0.30)' }}
        />
      </div>
    );
  }

  if (style === 'gradient') {
    return (
      <div
        aria-hidden
        className={cn('absolute inset-0 pointer-events-none opacity-80', className)}
        style={{ background: bg }}
      >
        <div
          className="absolute inset-0 saturate-150"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, #00f2fe 0%, transparent 50%), radial-gradient(circle at 70% 60%, #4facfe 0%, transparent 50%), radial-gradient(circle at 50% 90%, #ff0844 0%, transparent 60%)',
          }}
        />
      </div>
    );
  }

  // image
  return (
    <div
      aria-hidden
      className={cn('absolute inset-0 pointer-events-none', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://picsum.photos/seed/vibrant/1000/700"
        alt="Abstract HD background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover select-none brightness-75 scale-105 saturate-125"
      />
      <div className="absolute inset-0 bg-black/25 mix-blend-overlay" />
    </div>
  );
}
