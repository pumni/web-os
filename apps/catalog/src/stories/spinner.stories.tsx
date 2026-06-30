import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="type-caption text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="type-caption text-muted-foreground">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="type-caption text-muted-foreground">lg</span>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Spinner />
      <span className="type-body text-muted-foreground">Loading…</span>
    </div>
  ),
};
