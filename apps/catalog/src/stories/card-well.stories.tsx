import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardWell } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / CardWell',
  component: CardWell,
} satisfies Meta<typeof CardWell>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <CardWell padding="lg">
        <p className="text-sm">This is a CardWell (recessed well surface) with lg padding.</p>
      </CardWell>
    </div>
  ),
};
