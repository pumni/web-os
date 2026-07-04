import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeading } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / SectionHeading',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-96">
      <SectionHeading
        eyebrow="System configuration"
        title="Settings & Privacy"
        description="Configure your personal preferences, security settings and device accounts."
      />
    </div>
  ),
};
