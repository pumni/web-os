import { Music } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

// fallow-ignore-next-line duplicate-export
export const pageNav: PageNav = {
  href: '/sky-player' as PageNav['href'],
  label: 'Sky Player',
  icon: Music,
  keywords: 'music song sheet play cotl instrument',
  group: 'Pages',
  order: 20,
};
