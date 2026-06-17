'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { PasswordFields } from '../password-fields';

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <AuthShell subtitle="Set your new account password." title="Reset Password">
      <form action={formAction} className="space-y-4">
        <PasswordFields
          pending={pending}
          errors={state.errors}
          message={state.message}
          submitText="Update Password"
          pendingText="Updating..."
        />
      </form>
    </AuthShell>
  );
}
