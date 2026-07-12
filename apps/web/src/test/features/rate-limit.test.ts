import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '../../app/api/watch/[roomId]/join/route';
import { updateProfile } from '../../features/profile/actions';
import { setLimiter } from '../../shared/lib/rate-limit';
import type { Limiter } from '../../shared/lib/rate-limit';
import { requireUser } from '@pumni/auth';
import { ensureRoomMembership } from '@/features/watch';

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@/features/watch', () => ({
  ensureRoomMembership: vi.fn(),
}));

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    UPSTASH_REDIS_REST_URL: undefined as string | undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined as string | undefined,
  },
}));

vi.mock('@pumni/env/server', () => ({
  serverEnv: mockEnv,
}));

vi.mock('server-only', () => ({}));

import { getLimiter } from '../../shared/lib/rate-limit';

describe('Rate limiting tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.UPSTASH_REDIS_REST_URL = undefined;
    mockEnv.UPSTASH_REDIS_REST_TOKEN = undefined;
  });

  afterEach(() => {
    setLimiter(null); // Reset singleton
  });

  it('injected failing limiter makes join route return 429 with Retry-After', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    // Mock failing limiter: reset time is 60 seconds from now
    const resetTime = Date.now() + 60000;
    const fakeLimiter: Limiter = {
      limit: async () => ({ success: false, reset: resetTime }),
    };
    setLimiter(fakeLimiter);

    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ roomId: 'room-456' });

    const response = await POST(mockRequest, { params: mockParams });
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('Retry-After')).toBe('60');

    const body = await response!.text();
    expect(body).toBe('Vượt quá giới hạn thao tác, vui lòng thử lại sau.');
    expect(ensureRoomMembership).not.toHaveBeenCalled();
  });

  it('injected failing limiter makes updateProfile action return 429 message', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    const fakeLimiter: Limiter = {
      limit: async () => ({ success: false, reset: Date.now() }),
    };
    setLimiter(fakeLimiter);

    const result = await updateProfile({
      username: 'username',
      fullName: 'Name',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Vượt quá giới hạn thao tác, vui lòng thử lại sau.',
    });
  });

  it('fails open and warns when Upstash Redis env vars are missing', async () => {
    mockEnv.UPSTASH_REDIS_REST_URL = undefined;
    mockEnv.UPSTASH_REDIS_REST_TOKEN = undefined;

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const limiter = getLimiter();
    expect(limiter).toBeDefined();

    const res = await limiter.limit('test-key');
    expect(res.success).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing')
    );

    consoleWarnSpy.mockRestore();
  });
});
