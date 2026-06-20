'use client';

import type { User } from '@supabase/supabase-js';
import { Calendar, Clock } from 'lucide-react';

import { CardSpotlight, CardContent, Avatar, AvatarImage, AvatarFallback, cn } from '@pumni/ui';

import { useClock } from '@/hooks/use-clock';
import { dateFormatter } from '@/lib/formatters';

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface DashboardHeaderCardProps {
  user: User;
}

export function DashboardHeaderCard({ user }: DashboardHeaderCardProps) {
  const timestamp = useClock();
  const date = timestamp ? new Date(timestamp) : null;

  const greeting = date ? getGreeting(date.getHours()) : 'Welcome';
  const timeString = date
    ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : '--:--';
  const dateString = date ? dateFormatter.format(date) : '';
  const initialLetter = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <CardSpotlight className="relative overflow-hidden transition-all duration-(--duration-base)">
      {/* Decorative ambient glow — purely visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-linear-to-tr from-(--brand-gradient-from)/10 to-(--brand-gradient-via)/10 blur-3xl"
      />

      <CardContent className="relative flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            size="lg"
            className="shrink-0 self-start border-2 border-primary/20 shadow-sm sm:self-auto"
          >
            {user.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || 'User'} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initialLetter}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h1 className="type-title leading-tight font-semibold text-foreground">
              {greeting},{' '}
              <span className="bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) bg-clip-text text-transparent">
                {user.email?.split('@')[0]}
              </span>
            </h1>
            <p className="type-label text-muted-foreground">
              Pick up where you left off — your rooms and tools are ready.
            </p>
          </div>
        </div>

        <div
          className={cn(
            'flex shrink-0 items-center gap-2 self-start rounded-xl border bg-card px-3 py-2 shadow-card md:self-auto',
          )}
        >
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:text-sm">
            <Clock className="size-3.5 text-primary" />
            <time
              dateTime={date?.toISOString()}
              className="font-mono font-semibold text-foreground tabular-nums"
            >
              {timeString}
            </time>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:text-sm">
            <Calendar className="size-3.5 text-primary" />
            <span className="text-foreground">{dateString}</span>
          </span>
        </div>
      </CardContent>
    </CardSpotlight>
  );
}
