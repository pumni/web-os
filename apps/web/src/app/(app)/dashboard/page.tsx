import { requireUser } from "@pumni/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.email}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-card-foreground">Profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your public account information.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-card-foreground">Settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure account preferences.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-card-foreground">Activity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Recent activity will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
