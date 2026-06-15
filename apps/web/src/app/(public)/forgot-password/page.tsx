'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { Input, Label, SubmitButton } from '@pumni/ui';

const initialState: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <AuthShell
      subtitle="Recover your account password."
      title="Forgot Password"
      description="Enter your email and we will send you a reset link."
      footer={
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to Sign In
        </Link>
      }
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="name@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            required
            disabled={pending}
            aria-invalid={state.errors?.email ? true : undefined}
          />
          {state.errors?.email?.[0] ? (
            <p className="text-sm text-destructive">{state.errors.email[0]}</p>
          ) : null}
        </div>

        {state.message ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="w-full">{pending ? 'Sending...' : 'Send Reset Link'}</SubmitButton>
      </form>
    </AuthShell>
  );
}
