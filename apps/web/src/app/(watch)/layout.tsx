import { Suspense } from "react";
import { getCurrentUser } from "@pumni/auth";
import { redirect } from "next/navigation";
import { DesktopBackground } from "@/components/app-shell/desktop-background";


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
    const isBuild = process.env.NEXT_PHASE?.includes("build");
    if (!isBuild) {
      redirect("/sign-in");
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col p-0 md:p-4 bg-background">
      <DesktopBackground />
      <div className="relative z-base flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
