'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from './button';

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'type'> & {
  /** Label content — kept required (Button makes it optional). */
  children: React.ReactNode;
};

function SubmitButton({
  ref,
  loading: manualLoading,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = manualLoading ?? pending;

  return (
    <Button
      ref={ref}
      type="submit"
      loading={isLoading}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {children}
    </Button>
  );
}

export { SubmitButton };
