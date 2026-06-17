import Link from 'next/link';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@pumni/ui';

type DashboardProfileCardProps = Readonly<{
  user: Pick<AuthUser, 'id' | 'email' | 'user_metadata'>;
}>;

export function DashboardProfileCard({ user }: DashboardProfileCardProps) {
  const initials = user.email?.slice(0, 2).toUpperCase() || 'US';
  const avatarUrl =
    (user.user_metadata as { avatar_url?: string | null } | null)?.avatar_url ?? undefined;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 ring-1 ring-border">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="type-caption font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="type-caption font-semibold text-foreground">Logged in</p>
          <p className="type-caption font-mono text-muted-foreground">
            ID: {user.id.slice(0, 8)}…
          </p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href="/settings/profile">Manage</Link>
      </Button>
    </div>
  );
}
