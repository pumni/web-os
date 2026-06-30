import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@pumni/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@pumni/ui/overlay';

const meta = {
  title: 'Overlay / Dialog',
  component: Dialog,
} satisfies Meta<typeof Dialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const WithoutCloseButton: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Minimal dialog</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Heads up</DialogTitle>
            <DialogDescription>A compact notice with no close button.</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    );
  },
};
