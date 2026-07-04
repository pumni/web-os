import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / Separator',
  component: Separator,
} satisfies Meta<typeof Separator>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Pumni UI</h4>
        <p className="text-sm text-muted-foreground">
          An open-source design system.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};
