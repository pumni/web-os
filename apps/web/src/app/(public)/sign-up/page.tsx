'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpAction, type AuthFormState } from '../auth-actions';
import { AuthShell } from '../auth-shell';
import { Input, Label, SubmitButton } from '@pumni/ui';

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
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="John Doe"
            type="text"
            required
            disabled={pending}
            aria-invalid={state.errors?.fullName ? true : undefined}
          />
          {state.errors?.fullName?.[0] ? (
            <p className="text-sm text-destructive">{state.errors.fullName[0]}</p>
          ) : null}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={pending}
            aria-invalid={state.errors?.password ? true : undefined}
          />
          {state.errors?.password?.[0] ? (
            <p className="text-sm text-destructive">{state.errors.password[0]}</p>
          ) : null}
        </div>

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
