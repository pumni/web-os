import { Layers } from 'lucide-react';
import type { PageNav } from '@/components/app-shell/page-nav';

// fallow-ignore-next-line duplicate-export
export const pageNav: PageNav = {
  href: '/nextjs-ecosystem' as PageNav['href'],
  label: 'Next.js 16.2.9',
  icon: Layers,
  keywords: 'nextjs react framework ecosystem',
  group: 'Developer',
  order: 20,
};
