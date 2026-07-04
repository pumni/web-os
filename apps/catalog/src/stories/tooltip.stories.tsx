import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@pumni/ui/overlay';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Overlay / Tooltip',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const OpenByDefault: Story = {
  render: () => (
    <div className="flex h-32 items-center justify-center p-4">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tooltip text open by default</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
};
