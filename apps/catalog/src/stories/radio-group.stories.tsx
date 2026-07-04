import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, RadioGroupItem, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / RadioGroup',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-one" id="disabled-one" />
        <Label htmlFor="disabled-one">Option One (Disabled)</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-two" id="disabled-two" />
        <Label htmlFor="disabled-two">Option Two (Disabled)</Label>
      </div>
    </RadioGroup>
  ),
};
