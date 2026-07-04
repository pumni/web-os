import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / Checkbox',
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checked-terms" defaultChecked />
      <Label htmlFor="checked-terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked">Disabled unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Disabled checked</Label>
      </div>
    </div>
  ),
};
