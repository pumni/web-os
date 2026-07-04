import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / ScrollArea',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-40 w-60 rounded-md border p-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium leading-none">Tags</h4>
        {Array.from({ length: 20 })
          .map((_, i, a) => `v1.2.0-beta.${a.length - i}`)
          .map((tag) => (
            <div key={tag} className="text-sm">
              {tag}
            </div>
          ))}
      </div>
    </ScrollArea>
  ),
};
