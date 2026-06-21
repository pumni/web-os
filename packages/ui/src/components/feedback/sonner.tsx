'use client';

import * as React from 'react';
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { Spinner } from './spinner';

/**
 * Toaster — Pumni OS-aligned wrapper around Sonner's `<Toaster>`.
 *
 * ### Design system integration
 * Toasts are a **floating layer** per `design-system.md`, so they use the
 * `glass-panel` surface (engineered glass: thin neutral fill, rim pair,
 * directional `--shadow-glass`). Z-index is pinned to `--z-toast` (1200 —
 * the topmost OS layer).
 *
 * ### Accessibility
 * - Sonner owns the `aria-live="polite"` region; no extra ARIA needed here.
 * - Motion duration maps to `--duration-base` (200 ms) so toast
 *   enter/exit respects the brand cadence. The global `prefers-reduced-motion`
 *   safety net in `glass.css` cuts all animations to 0.01 ms when needed.
 *
 * ### CSS variable mapping (Sonner → Pumni tokens)
 * | Sonner var        | Pumni token                       |
 * |-------------------|-----------------------------------|
 * | `--normal-bg`     | `--popover` (opaque fallback bg)  |
 * | `--normal-text`   | `--popover-foreground`            |
 * | `--normal-border` | `--border`                        |
 * | `--border-radius` | `--radius-md` (8 px — toast size) |
 * | `--toast-animation-duration` | `--duration-base`        |
 *
 * The `glass-panel` class (applied via `toastOptions.classNames.toast`)
 * overrides the background with the engineered glass surface for browsers
 * that support `backdrop-filter`; `--normal-bg` serves as the opaque fallback
 * for browsers / reduced-transparency mode.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as 'system' | 'light' | 'dark'}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Spinner size="sm" />,
      }}
      toastOptions={{
        classNames: {
          /**
           * Apply the glass-panel surface: engineered glass fill + rim pair +
           * directional shadow. The `--normal-bg` fallback in the style prop
           * below keeps the toast readable when backdrop-filter is unavailable
           * (reduced transparency / old browsers — see glass.css fallback
           * blocks).
           */
          toast: 'glass-panel',
          /**
           * Status chip colours via semantic status tokens:
           * success → `--success-foreground`, error → `--destructive`, etc.
           * Sonner's own data-attribute hooks keep these scoped.
           */
          success: 'text-success-foreground',
          error: 'text-destructive-foreground',
          warning: 'text-warning-foreground',
          info: 'text-primary-foreground',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
      style={
        {
          /**
           * Opaque surface fallback — consumed by Sonner when the glass-panel
           * backdrop-filter is unavailable (see glass.css @supports block and
           * prefers-reduced-transparency). Must stay as the `--popover` token
           * (not raw color) so it switches correctly between themes.
           */
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          /**
           * Radius: toasts are small floating elements → `rounded-md` (8 px).
           * Dialogs/sheets use `rounded-lg/xl`; toasts are narrower chrome.
           */
          '--border-radius': 'var(--radius-md)',
          /**
           * Motion duration: align to brand cadence (`--duration-base` = 200 ms).
           * The global reduced-motion safety net in glass.css will override
           * this to 0.01 ms when `prefers-reduced-motion: reduce` is active.
           */
          '--toast-animation-duration': 'var(--duration-base)',
          /**
           * Z-index: pin to the owned OS layering scale (`--z-toast` = 1200),
           * the topmost layer above command palette and tooltip.
           */
          zIndex: 'var(--z-toast)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
