import { Suspense } from 'react';
import { getCurrentUser } from '@pumni/auth';
import { redirect } from 'next/navigation';
import { DesktopBackground } from '@/shared/components/app-shell/desktop-background';

export default function WatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <AuthenticatedWatchShell>{children}</AuthenticatedWatchShell>
    </Suspense>
  );
}

async function AuthenticatedWatchShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    const isBuild = process.env.NEXT_PHASE?.includes('build');
    if (!isBuild) {
      redirect('/sign-in');
    }
  }

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <DesktopBackground />
      <div className="z-base relative flex min-h-0 flex-1 flex-col p-0 md:p-4">{children}</div>
    </div>
  );
}
