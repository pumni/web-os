'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { AuthField, SubmitButton } from '@pumni/ui';

const initialState: AuthFormState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <AuthShell
      subtitle="Create an account to get started."
      title="Sign Up"
      description="Enter your details to register a new account."
      footer={
        <>
          <span>Already have an account?</span>
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <AuthField
          id="fullName"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          required
          disabled={pending}
          error={state.errors?.fullName}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          required
          disabled={pending}
          error={state.errors?.email}
        />

        <AuthField
          id="password"
          label="Password"
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

        <SubmitButton className="w-full">{pending ? 'Signing up...' : 'Sign Up'}</SubmitButton>
      </form>
    </AuthShell>
  );
}
