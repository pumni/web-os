import { User } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

// fallow-ignore-next-line duplicate-export
export const pageNav: PageNav = {
  href: '/settings/profile',
  label: 'Profile',
  icon: User,
  keywords: 'settings account name avatar',
  group: 'Settings',
  order: 10,
};
