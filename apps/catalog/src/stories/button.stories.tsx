import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Form / Button',
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => <Button loading>Saving…</Button>,
};
