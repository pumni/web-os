import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / Switch',
  component: Switch,
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="checked-mode" defaultChecked />
      <Label htmlFor="checked-mode">Notifications Enabled</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked">Disabled off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Disabled on</Label>
      </div>
    </div>
  ),
};
