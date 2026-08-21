import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlassSurface } from '@pumni/ui/identity';

const meta = {
  title: 'Identity / GlassSurface',
  component: GlassSurface,
} satisfies Meta<typeof GlassSurface>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Glass only reads over a colourful backdrop: a 2-blob + scrim container. */
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

export const Panel: Story = {
  render: () => (
    <Backdrop>
      <GlassSurface variant="panel" className="max-w-sm p-6">
        <p className="type-heading">Glass panel</p>
        <p className="type-body text-muted-foreground">
          Floating frosted surface — toggle the theme in the toolbar to see the dark frost.
        </p>
      </GlassSurface>
    </Backdrop>
  ),
};
