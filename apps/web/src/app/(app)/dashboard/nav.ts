import { LayoutDashboard } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

export const pageNav: PageNav = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  group: 'Pages',
  order: 10,
};
