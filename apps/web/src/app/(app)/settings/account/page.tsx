import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardWell } from '@pumni/ui/layout';
import { getEntitlements, TierBadge, PortalButton } from '@/features/billing';
import { Button } from '@pumni/ui/form';
import Link from 'next/link';
import type { Route } from 'next';

export default async function AccountSettingsPage() {
  const entitlements = await getEntitlements();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account credentials, security, and subscription status.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>Your active billing tier and entitlement limits.</CardDescription>
          </div>
          <TierBadge tier={entitlements.tier} />
        </CardHeader>
        <CardContent className="space-y-4">
          <CardWell className="p-4 rounded-md">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wide">
              Entitlement limits
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Active watch rooms limit:</span>
                <span className="font-bold text-foreground">
                  {entitlements.maxActiveRooms ?? 'Unlimited'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Members per room limit:</span>
                <span className="font-bold text-foreground">
                  {entitlements.maxRoomMembers ?? 'Unlimited'}
                </span>
              </li>
            </ul>
          </CardWell>

          <div className="flex gap-3">
            {entitlements.tier === 'free' ? (
              <Link href={'/pricing' as Route}>
                <Button>Nâng cấp lên Pro</Button>
              </Link>
            ) : (
              <PortalButton tier={entitlements.tier} />
            )}
          </div>
        </CardContent>
      </Card>

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
