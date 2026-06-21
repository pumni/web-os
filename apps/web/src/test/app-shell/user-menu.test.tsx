import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserMenu } from '@/shared/components/app-shell/user-menu';


const signOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));
const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@pumni/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signOut,
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock('sonner', () => ({
  toast,
}));

describe('UserMenu', () => {
  it('opens the avatar menu and signs out', async () => {
    render(
      <UserMenu
        user={
          {
            email: 'alex@example.com',
            user_metadata: {
              full_name: 'Alex',
            },
          } as never
        }
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Open user menu' }), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith('Signed out successfully.');
    expect(push).toHaveBeenCalledWith('/sign-in');
    expect(refresh).toHaveBeenCalled();
  });
});
