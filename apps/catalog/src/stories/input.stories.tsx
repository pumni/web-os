import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Label, AuthField } from '@pumni/ui/form';

const meta = {
  title: 'Form / Input',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" placeholder="name@example.com" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="disabled">Disabled input</Label>
        <Input id="disabled" disabled placeholder="Cannot edit this" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invalid">Invalid input</Label>
        <Input id="invalid" aria-invalid="true" placeholder="Error state" />
      </div>
    </div>
  ),
};

export const AuthFields: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <AuthField
        id="auth-password"
        label="Password"
        type="password"
        placeholder="Enter password"
      />
      <AuthField
        id="auth-email-error"
        label="Invalid Auth Field"
        error={["This field is required"]}
        placeholder="Error state"
      />
    </div>
  ),
};
