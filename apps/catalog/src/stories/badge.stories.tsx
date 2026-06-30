import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / Badge',
  component: Badge,
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof meta>;

const tones = ['neutral', 'primary', 'success', 'warning', 'destructive'] as const;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {tones.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const WithPulse: Story = {
  render: () => (
    <Badge tone="success" pulse>
      Live
    </Badge>
  ),
};
