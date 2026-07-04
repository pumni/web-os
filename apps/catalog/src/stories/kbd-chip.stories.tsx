import type { Meta, StoryObj } from '@storybook/react-vite';
import { KbdChip } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / KbdChip',
  component: KbdChip,
} satisfies Meta<typeof KbdChip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <KbdChip tone="neutral">⌘K</KbdChip>
      <KbdChip tone="primary">Enter</KbdChip>
    </div>
  ),
};
