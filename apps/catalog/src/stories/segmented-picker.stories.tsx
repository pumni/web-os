import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedPicker, Label } from '@pumni/ui/form';

const meta = {
  title: 'Form / SegmentedPicker',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const options = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

function InteractivePicker(props: { disabled?: boolean }) {
  const [val, setVal] = React.useState('comfortable');
  return (
    <SegmentedPicker
      options={options}
      value={val}
      onChange={setVal}
      aria-label="Density selector"
      disabled={props.disabled}
    />
  );
}

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Label>Display density</Label>
      <InteractivePicker />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Label>Disabled segmented picker</Label>
      <InteractivePicker disabled />
    </div>
  ),
};
