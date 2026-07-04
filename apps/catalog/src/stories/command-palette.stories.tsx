import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommandPalette, type CommandItem } from '@pumni/ui/overlay';
import { Button } from '@pumni/ui/form';

const meta = {
  title: 'Overlay / CommandPalette',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const items: CommandItem[] = [
  { id: '1', label: 'Search Docs', keywords: 'docs help', group: 'Suggestions', onSelect: () => {} },
  { id: '2', label: 'View Profile', keywords: 'user me', group: 'Account', onSelect: () => {} },
  { id: '3', label: 'Settings', keywords: 'config preferences', group: 'Account', onSelect: () => {} },
];

function InteractivePalette() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="h-[400px]">
      <Button onClick={() => setOpen(true)}>Open Palette</Button>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} />
    </div>
  );
}

export const OpenByDefault: Story = {
  render: () => <InteractivePalette />,
};
