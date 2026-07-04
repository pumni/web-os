import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, PopoverContent, PopoverTrigger } from '@pumni/ui/overlay';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Overlay / Popover',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const OpenByDefault: Story = {
  render: () => (
    <div className="flex h-48 items-start justify-center p-4">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button>Popover Trigger</Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Popover Title</h4>
            <p className="type-caption text-muted-foreground">
              This is a popover container open by default for VRT.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
