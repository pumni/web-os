import { Suspense } from "react";
import { requireUser } from "@pumni/auth";
import { AppShell } from "@/components/app-shell/app-shell";

export const unstable_instant = { prefetch: "static" };

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
  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}

function ProtectedShellFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-sidebar hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <div className="space-y-2 p-4">
          <div className="h-9 rounded-md bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-topbar flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
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
