"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "../auth-actions";
import { AuthShell } from "../auth-shell";
import { Input, Label, SubmitButton } from "@pumni/ui";

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <AuthShell subtitle="Set your new account password." title="Reset Password">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
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

        <SubmitButton className="w-full">
          {pending ? "Updating..." : "Update Password"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
