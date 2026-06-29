import type { ComponentType } from 'react';
import type { Route } from 'next';

/**
 * Controls where a nav entry surfaces across the shell.
 *
 * - `'sidebar'`      — sidebar, mobile drawer, and command palette (default).
 * - `'user-menu'`    — avatar dropdown and command palette only.
 * - `'command-only'` — command palette only; hidden from all nav surfaces.
 */
export type NavScope = 'sidebar' | 'user-menu' | 'command-only';

/**
 * Per-page navigation metadata. Each route under `app/(app)/` co-locates a
 * `nav.ts` sibling file exporting `pageNav`; the registry discovers them all,
 * so adding a feature means dropping one file — no central list to edit.
 */
export type PageNav = {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Extra search terms for the command palette. */
  keywords?: string;
  /** Heading under which this entry is grouped in sidebar + command palette. */
  group?: string;
  /** Sort weight — lower renders first within its group and the flat list. */
  order: number;
  /**
   * Declares which shell surfaces render this item.
   * Omitting the field is equivalent to `'sidebar'`.
   */
  navScope?: NavScope;
};
