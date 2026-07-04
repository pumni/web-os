import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@pumni/ui/overlay';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Overlay / Sheet',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const OpenByDefault: Story = {
  render: () => (
    <div className="h-[400px]">
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Panel</SheetTitle>
            <SheetDescription>
              This is a sheet component open by default for VRT.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
