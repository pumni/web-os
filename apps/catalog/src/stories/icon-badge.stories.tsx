import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconBadge } from '@pumni/ui/layout';
import { ActivityIcon, SettingsIcon, UserIcon } from 'lucide-react';

const meta = {
  title: 'Layout / IconBadge',
  component: IconBadge,
} satisfies Meta<typeof IconBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconBadge tone="primary-soft" size="md">
        <ActivityIcon />
      </IconBadge>
      <IconBadge tone="raised" size="md">
        <SettingsIcon />
      </IconBadge>
      <IconBadge tone="muted" size="md">
        <UserIcon />
      </IconBadge>
    </div>
  ),
};
