import type { ReactNode } from 'react';
import type { Story } from '@ladle/react';
import { GlassSurface } from '@pumni/ui/identity';

export default { title: 'Identity / GlassSurface' };

/** Glass only reads over a colourful backdrop (ADR-0012): a 2-blob + scrim container. */
function Backdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-muted/30 p-12">
      <div
        className="absolute -top-10 -left-10 size-56 rounded-full opacity-50 blur-3xl"
        style={{ background: 'var(--desktop-blob-primary)' }}
      />
      <div
        className="absolute -right-10 -bottom-10 size-56 rounded-full opacity-55 blur-3xl"
        style={{ background: 'var(--desktop-blob-secondary)' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export const Panel: Story = () => (
  <Backdrop>
    <GlassSurface variant="panel" className="max-w-sm p-6">
      <p className="type-heading">Glass panel</p>
      <p className="type-body text-muted-foreground">
        Floating frosted surface — toggle the theme in the toolbar to see the dark frost.
      </p>
    </GlassSurface>
  </Backdrop>
);
