import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom } from '../../features/watch/actions';
import { ensureRoomMembership, RoomFullError } from '../../features/watch/queries';
import { POST } from '../../app/api/watch/[roomId]/join/route';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import type { NextRequest } from 'next/server';

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@pumni/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('../../shared/lib/rate-limit', () => ({
  withRateLimit: vi.fn((key, cb) => cb()),
  limitOr429: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../shared/lib/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Watch Quota Messages', () => {
  let mockSupabase: unknown;
  let mockInsertResult: { data: unknown; error: { code: string; message: string } | null };

  beforeEach(() => {
    vi.resetAllMocks();
    mockInsertResult = { data: null, error: null };

    const mockQueryBuilder = {
      insert: vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockImplementation(() => {
            return {
              maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
            };
          }),
          then: vi.fn().mockImplementation((onfulfilled) => {
            return Promise.resolve(mockInsertResult).then(onfulfilled);
          }),
        };
      }),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  describe('createRoom quota failure messages', () => {
    it('returns localized Vietnamese warning on 42501 quota limit', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      mockInsertResult = {
        data: null,
        error: { code: '42501', message: 'RLS check failed' },
      };

      const result = await createRoom({
        sourceType: 'youtube',
        sourceRef: 'dQw4w9WgXcQ',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Bạn đã đạt giới hạn phòng đang hoạt động của gói hiện tại. Nâng cấp để tạo thêm phòng.',
      });
    });

    it('returns standard generic failure message on other DB errors', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      mockInsertResult = {
        data: null,
        error: { code: 'other_error_code', message: 'Connection timeout' },
      };

      const result = await createRoom({
        sourceType: 'youtube',
        sourceRef: 'dQw4w9WgXcQ',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Không thể tạo phòng lúc này. Vui lòng thử lại sau.',
      });
    });
  });

  describe('ensureRoomMembership quota limit', () => {
    it('throws RoomFullError when insert violates RLS policy (42501)', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      mockInsertResult = {
        data: null,
        error: { code: '42501', message: 'RLS check failed' },
      };

      await expect(ensureRoomMembership('room-123')).rejects.toThrow(RoomFullError);
    });

    it('makes join route return 403 when RoomFullError is thrown', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      mockInsertResult = {
        data: null,
        error: { code: '42501', message: 'RLS check failed' },
      };

      const request = new Request('http://localhost') as unknown as NextRequest;
      const params = Promise.resolve({ roomId: 'room-123' });

      const response = await POST(request, { params });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.ok).toBe(false);
    });
  });
});
