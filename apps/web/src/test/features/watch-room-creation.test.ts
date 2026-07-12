import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom } from '../../features/watch/actions';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { getEntitlementsForUser } from '../../features/billing/queries';

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@pumni/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('../../features/billing/queries', () => ({
  getEntitlementsForUser: vi.fn(),
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

describe('Watch Room Creation Entitlements', () => {
  let mockSupabase: unknown;
  let mockCount = 0;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCount = 0;

    const mockQueryBuilder: {
      select: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
      then: (onfulfilled: (value: unknown) => unknown) => Promise<unknown>;
    } = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
      then: (onfulfilled) => {
        return Promise.resolve({ data: null, error: null }).then(onfulfilled);
      },
    };

    mockQueryBuilder.eq.mockImplementation(() => {
      return {
        then: (onfulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ count: mockCount, error: null }).then(onfulfilled),
      };
    });

    mockQueryBuilder.maybeSingle.mockImplementation(() => {
      return {
        then: (onfulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ data: { id: 'room-123', code: 'ABCD12' }, error: null }).then(onfulfilled),
      };
    });

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  it('allows creation when maxActiveRooms is null', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
    vi.mocked(getEntitlementsForUser).mockResolvedValue({
      tier: 'max',
      maxActiveRooms: null,
      maxRoomMembers: null,
    });

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.roomId).toBe('room-123');
    }
  });

  it('allows creation when user has fewer rooms than maxActiveRooms limit', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
    vi.mocked(getEntitlementsForUser).mockResolvedValue({
      tier: 'free',
      maxActiveRooms: 1,
      maxRoomMembers: 5,
    });

    mockCount = 0;

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(true);
  });

  it('blocks creation when user is at the maxActiveRooms limit', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
    vi.mocked(getEntitlementsForUser).mockResolvedValue({
      tier: 'free',
      maxActiveRooms: 1,
      maxRoomMembers: 5,
    });

    mockCount = 1;

    const result = await createRoom({
      sourceType: 'youtube',
      sourceRef: 'dQw4w9WgXcQ',
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toBe('Bạn đã đạt giới hạn tối đa 1 phòng hoạt động. Vui lòng nâng cấp gói dịch vụ để tạo thêm.');
  });
});
