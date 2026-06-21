import { ComponentIcon } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';


export const pageNav: PageNav = {
  href: '/design-system' as PageNav['href'],
  label: 'Design System',
  icon: ComponentIcon,
  keywords: 'tokens components qa visual',
  group: 'Developer',
  order: 10,
};
