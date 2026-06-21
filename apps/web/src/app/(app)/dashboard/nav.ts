import { LayoutDashboard } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';


export const pageNav: PageNav = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  group: 'Pages',
  order: 10,
};
