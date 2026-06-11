import { requireUser } from "@pumni/auth";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}
