import { Music } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';


export const pageNav: PageNav = {
  href: '/sky-player' as PageNav['href'],
  label: 'Sky Player',
  icon: Music,
  keywords: 'music song sheet play cotl instrument',
  group: 'Pages',
  order: 20,
};
