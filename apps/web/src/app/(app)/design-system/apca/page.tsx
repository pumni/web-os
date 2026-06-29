'use client';

import { ApcaContrastSection } from '@/features/design-system/components/foundations-section';
import { ShowcaseSection } from '@/features/design-system/components/showcase-section';

export default function ApcaPage() {
  return (
    <ShowcaseSection
      id="apca"
      title="APCA & Contrast"
      description="APCA Lc contrast verification, color pickers, and dynamic inverse-APCA contrast derivation tools."
    >
      <ApcaContrastSection />
    </ShowcaseSection>
  );
}
