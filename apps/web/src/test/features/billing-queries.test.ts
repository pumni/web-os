import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { getEntitlements, getEntitlementsForUser, getPlans } from '../../features/billing/queries';
import { requireUser } from '@pumni/auth';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Billing Queries', () => {
  let mockSupabase: unknown;
  let mockRpc: Mock;
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.order.mockReturnThis();
    mockQueryBuilder.then.mockImplementation((onfulfilled: (value: unknown) => unknown) => {
      return Promise.resolve({ data: null, error: null }).then(onfulfilled);
    });

    mockSupabase = {
      rpc: mockRpc,
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };
    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createSupabaseServiceRoleClient>);
  });

  describe('getEntitlementsForUser', () => {
    it('returns parsed entitlements when RPC succeeds', async () => {
      mockRpc.mockResolvedValue({
        data: [{ tier: 'pro', max_active_rooms: 10, max_room_members: 20 }],
        error: null,
      });

      const result = await getEntitlementsForUser('user-123');
      expect(result).toEqual({
        tier: 'pro',
        maxActiveRooms: 10,
        maxRoomMembers: 20,
      });
      expect(mockRpc).toHaveBeenCalledWith('get_user_entitlements', { p_user: 'user-123' });
    });

    it('falls back to free tier when RPC returns empty data', async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getEntitlementsForUser('user-123');
      expect(result).toEqual({
        tier: 'free',
        maxActiveRooms: 1,
        maxRoomMembers: 5,
      });
    });

    it('falls back to free tier when RPC returns error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failure'),
      });

      const result = await getEntitlementsForUser('user-123');
      expect(result).toEqual({
        tier: 'free',
        maxActiveRooms: 1,
        maxRoomMembers: 5,
      });
    });
  });

  describe('getEntitlements', () => {
    it('requires authenticated user and fetches entitlements', async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: 'user-123' } as unknown as Awaited<ReturnType<typeof requireUser>>);
      mockRpc.mockResolvedValue({
        data: [{ tier: 'max', max_active_rooms: null, max_room_members: null }],
        error: null,
      });

      const result = await getEntitlements();
      expect(result).toEqual({
        tier: 'max',
        maxActiveRooms: null,
        maxRoomMembers: null,
      });
      expect(requireUser).toHaveBeenCalled();
    });
  });

  describe('getPlans', () => {
    it('returns plans from database when successful', async () => {
      const mockPlans = [
        { tier: 'free', max_active_rooms: 1, max_room_members: 5 },
        { tier: 'pro', max_active_rooms: 10, max_room_members: 20 },
      ];

      mockQueryBuilder.then.mockImplementation((onfulfilled: (value: unknown) => unknown) => {
        return Promise.resolve({ data: mockPlans, error: null }).then(onfulfilled);
      });

      const result = await getPlans();
      expect(result).toEqual(mockPlans);
    });

    it('throws error when database query fails', async () => {
      const dbError = new Error('Database select failed');
      mockQueryBuilder.then.mockImplementation((onfulfilled: (value: unknown) => unknown) => {
        return Promise.resolve({ data: null, error: dbError }).then(onfulfilled);
      });

      await expect(getPlans()).rejects.toThrow('Database select failed');
    });
  });
});
