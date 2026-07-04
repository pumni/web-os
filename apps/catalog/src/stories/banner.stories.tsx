import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / Banner',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const tones = ['info', 'success', 'warning', 'error'] as const;

export const Default: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      {tones.map((tone) => (
        <Banner key={tone} tone={tone} title={`${tone} Title`}>
          This is an example description for the {tone} banner.
        </Banner>
      ))}
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      {tones.map((tone) => (
        <Banner key={tone} tone={tone} size="compact" title={`${tone} Compact Banner`} />
      ))}
    </div>
  ),
};
