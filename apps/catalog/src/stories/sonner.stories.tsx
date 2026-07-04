import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toaster } from '@pumni/ui/feedback';
import { toast } from 'sonner';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Feedback / Toaster',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

function SonnerDemo() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => toast.success('Action completed successfully')}>
          Success Toast
        </Button>
        <Button onClick={() => toast.error('An error occurred')}>
          Error Toast
        </Button>
      </div>
      <Toaster />
    </div>
  );
}

export const Default: Story = {
  render: () => <SonnerDemo />,
};
