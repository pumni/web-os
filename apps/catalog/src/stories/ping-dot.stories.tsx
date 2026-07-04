import type { Meta, StoryObj } from '@storybook/react-vite';
import { PingDot } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / PingDot',
  component: PingDot,
} satisfies Meta<typeof PingDot>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-primary flex items-center gap-2">
        <PingDot size="sm" />
        <span className="text-xs">Primary Active</span>
      </div>
      <div className="text-success flex items-center gap-2">
        <PingDot size="md" />
        <span className="text-xs">Success Active</span>
      </div>
      <div className="text-destructive flex items-center gap-2">
        <PingDot size="lg" />
        <span className="text-xs">Destructive Active</span>
      </div>
    </div>
  ),
};

export const Static: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-primary flex items-center gap-2">
        <PingDot size="md" pulse={false} />
        <span className="text-xs">Static Primary</span>
      </div>
    </div>
  ),
};
