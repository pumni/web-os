import { Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@pumni/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell/app-shell';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<ProtectedShellFallback />}>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  );
}

async function AuthenticatedAppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    const isBuild = process.env.NEXT_PHASE?.includes('build');
    if (isBuild) {
      // Static prerender during `next build` runs without a session; supply a
      // typed placeholder so the shell can render its skeleton.
      const dummyUser: User = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'guest@pumni.os',
        app_metadata: {},
        user_metadata: { avatar_url: null },
        aud: 'authenticated',
        created_at: new Date(0).toISOString(),
      };
      return <AppShell user={dummyUser}>{children}</AppShell>;
    } else {
      redirect('/sign-in');
    }
  }

  return <AppShell user={user}>{children}</AppShell>;
}

function ProtectedShellFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-sidebar hidden w-64 bg-card lg:block">
        <div className="flex h-16 items-center px-6">
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <div
          aria-hidden
          className="mx-auto h-px bg-linear-to-r from-transparent via-glass-border/20 to-transparent"
        />
        <div className="space-y-2 p-4">
          <div className="h-9 rounded-md bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="glass-bar-edge-b sticky top-0 z-topbar flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-5 w-32 rounded bg-muted lg:hidden" />
          <div className="h-8 w-8 rounded-full bg-muted" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
          <div className="h-32 rounded-lg border border-border bg-card" />
        </main>
      </div>
    </div>
  );
}
