import type { Route } from 'next';
import type { ComponentType } from 'react';

import type { PageNav } from './page-nav';

// Each route owns a `nav.ts` sibling exporting `pageNav`. This module is the
// one place that knows about every page — adding a feature means creating one
// `nav.ts` file plus one import line here. The sidebar, mobile drawer, and
// command palette all consume the derived `navItems` below, so search and
// navigation can never drift apart.
//
// Explicit imports (rather than import.meta.webpackContext) keep this reliable
// on Turbopack + React Compiler while still co-locating metadata with its page.
import { pageNav as dashboard } from '@/app/(app)/dashboard/nav';
import { pageNav as skyPlayer } from '@/app/(app)/sky-player/nav';
import { pageNav as watch } from '@/app/(app)/watch/nav';
import { pageNav as profile } from '@/app/(app)/settings/profile/nav';
import { pageNav as account } from '@/app/(app)/settings/account/nav';
import { pageNav as appearance } from '@/app/(app)/settings/appearance/nav';
import { pageNav as designSystem } from '@/app/(app)/design-system/nav';
import { pageNav as nextjsEcosystem } from '@/app/(app)/nextjs-ecosystem/nav';

export type NavItem = {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
  keywords?: string;
  group?: string;
};

const pages: PageNav[] = [
  dashboard,
  skyPlayer,
  watch,
  profile,
  account,
  appearance,
  designSystem,
  nextjsEcosystem,
];

/**
 * Derived, sorted nav list. `order` controls position within the flat list and
 * (by convention) within each `group`. Stripping `order` at the boundary keeps
 * the consumer-facing `NavItem` minimal — order is a registry concern only.
 */
export const navItems: ReadonlyArray<NavItem> = pages
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(({ order: _order, ...rest }) => {
    void _order;
    return rest;
  });
