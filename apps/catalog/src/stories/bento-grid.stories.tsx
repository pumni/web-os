import type { Meta, StoryObj } from '@storybook/react-vite';
import { BentoGrid, BentoGridItem } from '@pumni/ui/os';

const meta = {
  title: 'Layout / BentoGrid',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[800px] border border-border p-4 rounded-xl bg-background">
      <BentoGrid rowHeight={120}>
        <BentoGridItem tier="hero" title="Dashboard Hero" description="Main highlight metric">
          <div className="h-full flex items-center justify-center bg-primary/5 rounded-md border border-primary/10">
            Hero Area
          </div>
        </BentoGridItem>
        <BentoGridItem tier="feature" title="Quick Actions">
          <div className="text-xs">Quick controls go here.</div>
        </BentoGridItem>
        <BentoGridItem tier="metric" title="1,420" ariaLabel="1,420 Active Users">
          <div className="text-xs text-muted-foreground">Active Users</div>
        </BentoGridItem>
        <BentoGridItem tier="accent" title="Overview">
          <div className="text-xs">System logs.</div>
        </BentoGridItem>
      </BentoGrid>
    </div>
  ),
};
