import { Suspense } from "react";
import { getCurrentUser } from "@pumni/auth";
import { redirect } from "next/navigation";

export const unstable_instant = {
  prefetch: "static",
  samples: [
    {
      params: { itemId: "00000000000000000000000000000000" }
    }
  ]
};

export default function WatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div className="min-h-dvh" style={{ backgroundColor: "black" }} />}>
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
    <div
      className="min-h-dvh flex items-center justify-center p-0 md:p-6"
      style={{ backgroundColor: "black" }}
    >
      {children}
    </div>
  );
}
