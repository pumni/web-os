import { Settings } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

export const pageNav: PageNav = {
  href: '/settings/account',
  label: 'Account',
  icon: Settings,
  keywords: 'settings email password security',
  group: 'Settings',
  order: 20,
};
