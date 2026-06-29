'use client';

import { FoundationsSection, IdentitySection } from '@/features/design-system';

export default function TokensPage() {
  return (
    <div className="space-y-12">
      <FoundationsSection hideApca={true} />
      <IdentitySection />
    </div>
  );
}
