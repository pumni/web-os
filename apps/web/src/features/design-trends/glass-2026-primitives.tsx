'use client';

import * as React from 'react';
import { GlassSurface } from '@pumni/ui/identity';
import { Card } from '@pumni/ui/layout';
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

const PRESETS: { value: BackdropPreset; label: string }[] = [
  { value: 'mesh', label: 'Cosmic Mesh' },
  { value: 'shapes', label: 'Sharp Shapes' },
  { value: 'grid', label: 'Modern Grid' },
  { value: 'off', label: 'Tắt (Flat)' },
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
  if (preset === 'mesh') {
    return (
      <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700 bg-[#050608]', className)}>
        <div className="absolute top-[15%] left-[20%] w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 opacity-65 blur-[35px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[220px] h-[220px] rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 opacity-60 blur-[45px]" />
        <div className="absolute top-[40%] right-[30%] w-[120px] h-[120px] rounded-full bg-cyan-500 opacity-55 blur-[25px]" />
      </div>
    );
  }
  if (preset === 'shapes') {
    return (
      <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700 bg-[#050608] flex items-center justify-center', className)}>
        <div className="absolute w-40 h-40 bg-pink-500 rotate-[22deg] rounded-3xl opacity-70 blur-[2px] translate-x-[-80px] translate-y-[-40px]" />
        <div className="absolute w-48 h-48 bg-purple-600 rotate-[55deg] rounded-xl opacity-60 blur-[3px] translate-x-[90px] translate-y-[60px]" />
        <div className="absolute w-32 h-32 bg-cyan-400 rounded-full opacity-65 blur-[1px] translate-y-[-90px]" />
      </div>
    );
  }
  // grid
  return (
    <div aria-hidden className={cn('absolute inset-0 pointer-events-none transition-all duration-700 bg-[#050608]', className)}>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1.5px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-[20%] left-[30%] w-[160px] h-[160px] bg-purple-600 opacity-60 blur-[50px]" />
      <div className="absolute bottom-[15%] right-[25%] w-[200px] h-[200px] bg-blue-600 opacity-50 blur-[60px]" />
    </div>
  );
}

