import { Sparkles } from 'lucide-react';
import type { PageNav } from '@/shared/components/app-shell/page-nav';

export const pageNav: PageNav = {
  href: '/design-trends' as PageNav['href'],
  label: 'Design Trends',
  icon: Sparkles,
  keywords: 'design trends glassmorphism bento grid ui styling tokens',
  group: 'Developer',
  order: 15,
};
