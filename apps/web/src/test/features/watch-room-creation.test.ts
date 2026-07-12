import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom } from '../../features/watch/actions';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';

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
}));

vi.mock('../../shared/lib/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Watch Room Creation Quota Enforcement', () => {
  let mockInsertResult: { data: unknown; error: { code: string; message: string } | null };

  beforeEach(() => {
    vi.resetAllMocks();
    mockInsertResult = {
      data: { id: 'room-123', code: 'ABCD12' },
      error: null,
    };

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  it('allows room creation on success', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.roomId).toBe('room-123');
      expect(result.data.code).toBe('ABCD12');
    }
  });

  it('blocks room creation when quota limit is reached (RLS error 42501)', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    mockInsertResult = {
      data: null,
      error: { code: '42501', message: 'new row violates row-level security policy' },
    };

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toBe(
      'Bạn đã đạt giới hạn phòng đang hoạt động của gói hiện tại. Nâng cấp để tạo thêm phòng.'
    );
  });

  it('returns generic error on other database failures', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

    mockInsertResult = {
      data: null,
      error: { code: 'some_other_code', message: 'DB connection reset' },
    };

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toBe(
      'Không thể tạo phòng lúc này. Vui lòng thử lại sau.'
    );
  });
});
