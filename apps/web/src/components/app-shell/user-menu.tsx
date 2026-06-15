'use client';

import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  withViewTransition,
} from '@pumni/ui';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';

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
            <p className="text-sm font-medium leading-none">
              {user.user_metadata['full_name'] ?? 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => withViewTransition(() => router.push('/settings/profile'))}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => withViewTransition(() => router.push('/settings/account'))}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
