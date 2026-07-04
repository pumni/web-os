import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataViz / ChartPalette',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-6 bg-card shadow-card">
      <div className="space-y-1">
        <h4 className="type-heading text-sm font-semibold">Chart Palette</h4>
        <p className="type-caption text-muted-foreground">
          Five semantic, CVD-safe chart colors with guaranteed Lc 45 contrast.
        </p>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex items-center gap-3">
            <div
              className="h-6 w-24 rounded-md border border-border/10"
              style={{ backgroundColor: `var(--chart-${num})` }}
            />
            <div className="flex-1 flex justify-between text-xs font-mono">
              <span className="text-foreground">--chart-{num}</span>
              <span className="text-muted-foreground">
                {num === 1 ? 'Accent lead' : num === 2 ? 'Indigo' : num === 3 ? 'Cyan' : num === 4 ? 'Amber' : 'Violet'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
