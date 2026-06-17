import { Settings } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

// fallow-ignore-next-line duplicate-export
export const pageNav: PageNav = {
  href: '/settings/account',
  label: 'Account',
  icon: Settings,
  keywords: 'settings email password security',
  group: 'Settings',
  order: 20,
};
