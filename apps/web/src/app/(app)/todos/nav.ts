import { CheckSquare } from 'lucide-react';
import type { Route } from 'next';
import type { PageNav } from '@/shared/components/app-shell/page-nav';

export const pageNav: PageNav = {
  href: '/todos' as Route,
  label: 'Todos',
  icon: CheckSquare,
  group: 'Pages',
  order: 20,
};
