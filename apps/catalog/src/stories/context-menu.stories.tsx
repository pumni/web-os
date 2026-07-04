import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@pumni/ui/overlay';

const meta = {
  title: 'Overlay / ContextMenu',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

function ContextMenuWrapper() {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
      triggerRef.current.dispatchEvent(event);
    }
  }, []);

  return (
    <div className="flex h-48 items-center justify-center">
      <ContextMenu>
        <ContextMenuTrigger ref={triggerRef}>
          <div className="flex size-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 text-center type-caption text-muted-foreground select-none">
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem>Back</ContextMenuItem>
          <ContextMenuItem disabled>Forward</ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Inspect</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export const OpenByDefault: Story = {
  render: () => <ContextMenuWrapper />,
};
