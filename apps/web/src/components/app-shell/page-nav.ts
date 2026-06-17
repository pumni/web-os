import type { ComponentType } from 'react';
import type { Route } from 'next';

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
};
