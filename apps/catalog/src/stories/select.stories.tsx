import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Label,
} from '@pumni/ui/form';

const meta = {
  title: 'Form / Select',
  component: Select,
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <Label htmlFor="fruit">Choose a fruit</Label>
      <Select defaultValue="apple">
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <Label htmlFor="disabled-fruit">Disabled Choose a fruit</Label>
      <Select disabled>
        <SelectTrigger id="disabled-fruit">
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
