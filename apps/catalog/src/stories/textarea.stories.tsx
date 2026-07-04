import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <Label htmlFor="bio">Biography</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="disabled">Disabled textarea</Label>
        <Textarea id="disabled" disabled placeholder="Cannot edit this" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invalid">Invalid textarea</Label>
        <Textarea id="invalid" aria-invalid="true" placeholder="Error state" />
      </div>
    </div>
  ),
};
