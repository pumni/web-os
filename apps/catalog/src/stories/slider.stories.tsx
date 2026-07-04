import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / Slider',
  component: Slider,
} satisfies Meta<typeof Slider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Label>Volume control</Label>
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Label>Disabled slider</Label>
      <Slider defaultValue={[25]} max={100} step={1} disabled />
    </div>
  ),
};
