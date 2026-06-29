'use client';

import { FoundationsSection } from '@/features/design-system/components/foundations-section';
import { IdentitySection } from '@/features/design-system/components/identity-section';

export default function TokensPage() {
  return (
    <div className="space-y-12">
      <FoundationsSection hideApca={true} />
      <IdentitySection />
    </div>
  );
}
