import { Clapperboard } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';

export const pageNav: PageNav = {
  href: '/watch' as PageNav['href'],
  label: 'Watch Together',
  icon: Clapperboard,
  keywords: 'movie video room sync co-watch party',
  group: 'Pages',
  order: 30,
};
