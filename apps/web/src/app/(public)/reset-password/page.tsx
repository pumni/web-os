'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { AuthField, SubmitButton } from '@pumni/ui';

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <AuthShell subtitle="Set your new account password." title="Reset Password">
      <form action={formAction} className="space-y-4">
        <AuthField
          id="password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
          error={state.errors?.password}
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
          error={state.errors?.confirmPassword}
        />

        {state.message ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="w-full">
          {pending ? 'Updating...' : 'Update Password'}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
