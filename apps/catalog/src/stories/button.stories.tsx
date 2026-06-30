import type { Story } from '@ladle/react';
import { Button } from '@pumni/ui/form';

export default { title: 'Form / Button' };

const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

export const Variants: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    {variants.map((variant) => (
      <Button key={variant} variant={variant}>
        {variant}
      </Button>
    ))}
  </div>
);

export const Sizes: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">Small</Button>
    <Button>Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Loading: Story = () => <Button loading>Saving…</Button>;
