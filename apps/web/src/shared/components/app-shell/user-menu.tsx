'use client';

import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@pumni/ui/layout';
import { Button } from '@pumni/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@pumni/ui/overlay';
import { withViewTransition } from '@pumni/ui/lib/view-transition';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';

import { userMenuNavItems } from './nav-items';

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Signed out successfully.');
      router.push('/sign-in');
      router.refresh();
    } catch {
      toast.error('Failed to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const email = user.email ?? '';
  const initial = email ? email[0]?.toUpperCase() : 'U';
  const avatarUrl =
    typeof user.user_metadata['avatar_url'] === 'string'
      ? user.user_metadata['avatar_url']
      : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          pressable={false}
          className="relative rounded-full p-0"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={email} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {user.user_metadata['full_name'] ?? 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMenuNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.href}
              onClick={() =>
                withViewTransition(() => router.push(item.href), { type: 'slide-forward' })
              }
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

