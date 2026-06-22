'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { AuthField, SubmitButton } from '@pumni/ui/form';

const initialState: AuthFormState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <AuthShell
      subtitle="Welcome back. Please sign in to your account."
      title="Sign In"
      description="Enter your credentials to access the OS dashboard."
      footer={
        <>
          <span>Don&apos;t have an account?</span>
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          minLength={8}
          required
          disabled={pending}
          error={state.errors?.password}
          trailing={
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </Link>
          }
        />

        {state.message ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="w-full">{pending ? 'Signing in...' : 'Sign In'}</SubmitButton>
      </form>
    </AuthShell>
  );
}
