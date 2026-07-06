'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Backdrop presets for the Glassmorphism 2.0 playground.
 *
 * Each preset renders a colourful backdrop that a glass surface can refract
 * (ADR-0012 backdrop precondition). The presets differ in dominant hue so
 * the *background-reactive tint* technique has something reactive to react
 * to — coral blobs push the tint warm, cyan/indigo blobs push it cool.
 */
export type BackdropPreset = 'mesh' | 'shapes' | 'grid' | 'off';

export interface DominantColor {
  l: number;
  c: number;
  h: number;
}

export interface PresetInfo {
  value: BackdropPreset;
  label: string;
  dominant: DominantColor | null;
}

const PRESETS: PresetInfo[] = [
  { value: 'mesh', label: 'Cosmic Mesh', dominant: { l: 0.55, c: 0.22, h: 300 } },
  { value: 'shapes', label: 'Sharp Shapes', dominant: { l: 0.60, c: 0.20, h: 330 } },
  { value: 'grid', label: 'Modern Grid', dominant: { l: 0.50, c: 0.18, h: 265 } },
  { value: 'off', label: 'Tắt (Flat)', dominant: null },
];

export { PRESETS as BACKDROP_PRESETS };

/** Render a backdrop preset as an absolutely-positioned layer. */
export function GlassBackdrop({
  preset,
  className,
  isDark = true,
}: {
  preset: BackdropPreset;
  className?: string;
  isDark?: boolean;
}) {
  const bgClass = isDark ? 'bg-[#050608]' : 'bg-[#f8fafc]';
  const dotColor = isDark ? '#334155' : '#cbd5e1';

  if (preset === 'off') {
    return <div aria-hidden className={cn('absolute inset-0 bg-background', className)} />;
  }
  if (preset === 'mesh') {
    return (
      <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700', bgClass, className)}>
        <div className={cn(
          "absolute top-[15%] left-[20%] w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 blur-[35px] transition-all",
          isDark ? "opacity-65" : "opacity-35"
        )} />
        <div className={cn(
          "absolute bottom-[10%] right-[15%] w-[220px] h-[220px] rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 blur-[45px] transition-all",
          isDark ? "opacity-60" : "opacity-30"
        )} />
        <div className={cn(
          "absolute top-[40%] right-[30%] w-[120px] h-[120px] rounded-full bg-cyan-500 blur-[25px] transition-all",
          isDark ? "opacity-55" : "opacity-25"
        )} />
      </div>
    );
  }
  if (preset === 'shapes') {
    return (
      <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700 flex items-center justify-center', bgClass, className)}>
        <div className={cn(
          "absolute w-40 h-40 bg-pink-500 rotate-[22deg] rounded-3xl blur-[2px] translate-x-[-80px] translate-y-[-40px] transition-all",
          isDark ? "opacity-70" : "opacity-35"
        )} />
        <div className={cn(
          "absolute w-48 h-48 bg-purple-600 rotate-[55deg] rounded-xl blur-[3px] translate-x-[90px] translate-y-[60px] transition-all",
          isDark ? "opacity-60" : "opacity-30"
        )} />
        <div className={cn(
          "absolute w-32 h-32 bg-cyan-400 rounded-full blur-[1px] translate-y-[-90px] transition-all",
          isDark ? "opacity-65" : "opacity-35"
        )} />
      </div>
    );
  }
  // grid
  return (
    <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700', bgClass, className)}>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1.5px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className={cn(
        "absolute top-[20%] left-[30%] w-[160px] h-[160px] bg-purple-600 blur-[50px] transition-all",
        isDark ? "opacity-60" : "opacity-30"
      )} />
      <div className={cn(
        "absolute bottom-[15%] right-[25%] w-[200px] h-[200px] bg-blue-600 blur-[60px] transition-all",
        isDark ? "opacity-50" : "opacity-25"
      )} />
    </div>
  );
}

