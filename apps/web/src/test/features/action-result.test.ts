import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateProfile } from '../../features/profile/actions';
import { actionFailure, parseActionInput } from '../../shared/lib/action-result';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { requireUser } from '@pumni/auth';

vi.mock('server-only', () => ({}));

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@pumni/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';

describe('ActionResult and error handling', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockReset();
  });

  it('actionFailure logs the error and returns a generic public message', () => {
    const originalError = new Error('Database connection failed');
    const publicMsg = 'An error occurred, please try again.';
    const result = actionFailure(originalError, publicMsg);

    expect(result).toEqual({ ok: false, message: publicMsg });
    expect(consoleErrorSpy).toHaveBeenCalledWith(originalError);
    expect(Sentry.captureException).toHaveBeenCalledWith(originalError);
  });

  it('parseActionInput parses valid/invalid input against schema', () => {
    const mockSchema = {
      safeParse: (val: unknown) => {
        if (val === 'valid') {
          return { success: true as const, data: 'parsed_valid' };
        }
        return { success: false as const };
      },
    };

    expect(parseActionInput(mockSchema, 'valid', 'Error')).toEqual({ ok: true, data: 'parsed_valid' });
    expect(parseActionInput(mockSchema, 'invalid', 'Custom Error')).toEqual({ ok: false, message: 'Custom Error' });
  });

  it('updateProfile returns generic message on database error and logs the original error', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    const mockPostgrestError = { message: 'Database constraint violation', code: '23505' };
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: mockPostgrestError }),
        }),
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);

    const result = await updateProfile({
      username: 'newusername',
      fullName: 'New Name',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockPostgrestError);
    expect(Sentry.captureException).toHaveBeenCalledWith(mockPostgrestError);
  });
});
