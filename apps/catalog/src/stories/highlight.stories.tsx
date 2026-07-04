import type { Meta, StoryObj } from '@storybook/react-vite';
import { Highlight } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / Highlight',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 p-4 border rounded-lg bg-card text-sm">
      <Highlight
        text="Modernizing the design system using relative color pipeline in oklch."
        query="relative color"
        matchClassName="bg-primary/20 text-primary font-bold px-0.5 rounded"
      />
    </div>
  ),
};
