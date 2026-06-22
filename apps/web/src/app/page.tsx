import Link from 'next/link';
import { getCurrentUser } from '@pumni/auth';
import { redirect } from 'next/navigation';
import { Button } from '@pumni/ui/form';

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-gradient-brand text-5xl font-bold tracking-tight sm:text-6xl">
          Pumni Web OS
        </h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground sm:text-xl">
          A modern, reusable monorepo SaaS starter foundation built with Next.js App Router, Bun
          workspaces, and Supabase SSR.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
