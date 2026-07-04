import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dock, DockItem } from '@pumni/ui/os';
import { ActivityIcon, SettingsIcon, UserIcon } from 'lucide-react';

const meta = {
  title: 'OS / Dock',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex h-24 items-end justify-center p-4 bg-muted/20">
      <Dock>
        <DockItem label="Activity" active>
          <ActivityIcon />
        </DockItem>
        <DockItem label="User">
          <UserIcon />
        </DockItem>
        <DockItem label="Settings">
          <SettingsIcon />
        </DockItem>
      </Dock>
    </div>
  ),
};
