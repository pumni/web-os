'use client';

import { AuthField, SubmitButton } from '@pumni/ui';

interface PasswordFieldsProps {
  pending: boolean;
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
  submitText: string;
  pendingText: string;
}

// fallow-ignore-next-line complexity
export function PasswordFields({
  pending,
  errors,
  message,
  submitText,
  pendingText,
}: PasswordFieldsProps) {
  return (
    <>
      <AuthField
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={pending}
        error={errors?.password}
      />
      <AuthField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={pending}
        error={errors?.confirmPassword}
      />

      {message ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {message}
        </p>
      ) : null}

      <SubmitButton className="w-full">{pending ? pendingText : submitText}</SubmitButton>
    </>
  );
}
