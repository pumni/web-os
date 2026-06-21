'use client';

import { SectionNav } from '@/components/section-nav';
import { PAGE_SECTIONS } from '../content';

export function SkyPlayerSectionNav() {
  return (
    <SectionNav
      sections={PAGE_SECTIONS.map((s) => ({ id: s.id, label: s.label }))}
      linkClassName="px-5 py-3.5"
    />
  );
}
