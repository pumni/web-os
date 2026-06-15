import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pumni/ui';

export default function AccountSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account credentials and security.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credentials &amp; Security</CardTitle>
          <CardDescription>Email, password, and security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Account settings are not implemented in Part 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
