import { Palette } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';


export const pageNav: PageNav = {
  href: '/settings/appearance',
  label: 'Appearance',
  icon: Palette,
  keywords: 'settings theme dark light mode color',
  group: 'Settings',
  order: 30,
};
