"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "../auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const initialState: AuthFormState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Pumni OS</h1>
          <p className="text-sm text-neutral-400">Create an account to get started.</p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl text-white">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your details to register a new account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-neutral-300">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  type="text"
                  required
                  disabled={pending}
                  className="border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-neutral-700"
                />
                {state.errors?.fullName?.[0] ? (
                  <p className="text-sm text-red-400">{state.errors.fullName[0]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                  Email
                </label>
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
                  className="border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-neutral-700"
                />
                {state.errors?.email?.[0] ? (
                  <p className="text-sm text-red-400">{state.errors.email[0]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={pending}
                  className="border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-neutral-700"
                />
                {state.errors?.password?.[0] ? (
                  <p className="text-sm text-red-400">{state.errors.password[0]}</p>
                ) : null}
              </div>

              {state.message ? (
                <p className="text-sm text-red-400" aria-live="polite">
                  {state.message}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                {pending ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-neutral-800/50 py-4 text-sm text-neutral-400">
            <span>Already have an account?</span>
            <Link href="/sign-in" className="font-medium text-white hover:underline">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
