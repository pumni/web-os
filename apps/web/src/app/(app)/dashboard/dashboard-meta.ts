import type { Route } from 'next';
import type { ComponentType } from 'react';
import { ComponentIcon, Music, Settings, Sparkles, User } from 'lucide-react';

import type { BentoTier } from '@pumni/ui';

/**
 * Single source of truth for the dashboard tile catalog.
 *
 * Copy + icon + tier live here so `page.tsx` stays a thin layout file and
 * future tweaks (i18n, copy review) have one place to land.
 */
export type QuickAction = Readonly<{
  id: string;
  label: string;
  href: Route;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
}>;

export const quickActions: ReadonlyArray<QuickAction> = [
  {
    id: 'design-system',
    label: 'Design System',
    href: '/design-system' as Route,
    icon: ComponentIcon,
  },
  { id: 'sky-player', label: 'Sky Player', href: '/nextjs-ecosystem' as Route, icon: Music },
  { id: 'profile', label: 'Manage profile', href: '/settings/profile', icon: User },
  { id: 'account', label: 'Account', href: '/settings/account', icon: Settings },
] as const;

/**
 * Tier + minimum-height pairing for the Bento grid. `minHeight` is passed to
 * `BentoGridItem`'s primitive prop, so tiles keep CLS-stable layout before
 * their content hydrates (see `packages/ui/src/components/os/bento-grid.tsx`).
 *
 * Tile math at desktop (12-col grid):
 *   Rows 1–2: hero (6×2) | sky-player (6×2)
 *   Row    3: recent rooms (12×1) strip
 */
export type DashboardTileId = 'hero' | 'sky-player';

export type DashboardTile = Readonly<{
  id: DashboardTileId;
  tier: BentoTier;
  minHeight?: number;
  /** Headings for the Bento card header primitive. */
  title?: string;
  description?: string;
  /** Icon rendered in `bg-primary/10` chip per the status-tint pattern. */
  icon?: ComponentType<{ className?: string }>;
}>;

export const tiles: ReadonlyArray<DashboardTile> = [
  // Hero keeps its 6×2 footprint because the Bento's first row is anchored by
  // it; the empty vertical space is filled with a brand-gradient glow rendered
  // by the tile body (see `page.tsx`).
  {
    id: 'hero',
    tier: 'hero',
    minHeight: 320,
    title: 'Welcome to Pumni OS',
    icon: Sparkles,
  },
  {
    id: 'sky-player',
    tier: 'hero', // 6×2 to mirror hero and fill the row
    minHeight: 320,
    title: 'Sky Player',
    description: 'Live preview',
    icon: Music,
  },
] as const;
