'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from './button';

type SubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'type' | 'loading' | 'disabled' | 'children' | 'pressable'
> & {
  loading?: boolean;
  disabled?: boolean;
  pressable?: boolean;
  children: React.ReactNode;
};

function SubmitButton({ loading: manualLoading, disabled, children, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = manualLoading ?? pending;

  return (
    <Button type="submit" loading={isLoading} disabled={disabled ?? isLoading} {...props}>
      {children}
    </Button>
  );
}

export { SubmitButton };
