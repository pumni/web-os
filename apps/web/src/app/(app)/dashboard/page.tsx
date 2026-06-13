import { requireUser } from "@pumni/auth";
import { ActivityIcon, SettingsIcon, UserIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@pumni/ui";
import { DashboardDock } from "./dashboard-dock";
import { WelcomeWindow } from "./welcome-window";

const featureCards = [
  {
    title: "Profile",
    description: "Manage your public account information.",
    icon: UserIcon,
  },
  {
    title: "Settings",
    description: "Configure account preferences.",
    icon: SettingsIcon,
  },
  {
    title: "Activity",
    description: "Recent activity will appear here.",
    icon: ActivityIcon,
  },
] as const;

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-gradient-brand text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user.email}.</p>
      </div>

      <WelcomeWindow />

      <div className="grid gap-4 md:grid-cols-3">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="gap-4 transition-all duration-(--duration-base) hover:-translate-y-1 hover:[box-shadow:var(--shadow-glass-glow),inset_0_1px_1px_-0.5px_var(--glass-highlight)]"
            >
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-(--brand-gradient-from) to-(--brand-gradient-via) text-primary-foreground shadow-sm ring-1 ring-[color:var(--glass-highlight)]">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <DashboardDock />
    </div>
  );
}
