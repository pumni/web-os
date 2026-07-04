import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / Progress',
  component: Progress,
} satisfies Meta<typeof Progress>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Progress value={33} />
      <Progress value={66} />
      <Progress value={100} />
    </div>
  ),
};
