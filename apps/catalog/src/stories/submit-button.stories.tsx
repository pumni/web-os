import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubmitButton } from '@pumni/ui/form';

const meta = {
  title: 'Form / SubmitButton',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <SubmitButton>Submit</SubmitButton>,
};

export const Loading: Story = {
  render: () => <SubmitButton loading>Submitting...</SubmitButton>,
};

export const Disabled: Story = {
  render: () => <SubmitButton disabled>Disabled Submit</SubmitButton>,
};
