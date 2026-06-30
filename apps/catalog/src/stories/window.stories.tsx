import type { Meta, StoryObj } from '@storybook/react-vite';
import { Window } from '@pumni/ui/os';
import { Card, CardContent, CardHeader, CardTitle } from '@pumni/ui/layout';

const meta = {
  title: 'OS / Window',
  component: Window,
} satisfies Meta<typeof Window>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Active = {
  args: { title: 'project-workspace.tsx — Visual Studio Code' },
  render: ({ title }: { title: React.ReactNode }) => (
    <Window title={title} active className="max-w-lg">
      <Card variant="inset">
        <CardHeader>
          <CardTitle>Welcome to Pumni OS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="type-body text-muted-foreground">
            A floating OS surface powered by Next.js, Radix, and motion.
          </p>
        </CardContent>
      </Card>
    </Window>
  ),
} satisfies Story;

export const Inactive = {
  args: { title: 'Inactive window' },
  render: ({ title }: { title: React.ReactNode }) => (
    <div className="flex flex-col gap-4">
      <Window title="Active window" active className="max-w-lg opacity-100">
        <div className="flex items-center justify-center py-8">
          <p className="type-body">Focused</p>
        </div>
      </Window>
      <Window title={title} active={false} className="max-w-lg">
        <div className="flex items-center justify-center py-8">
          <p className="type-body text-muted-foreground">Dimmed</p>
        </div>
      </Window>
    </div>
  ),
} satisfies Story;
