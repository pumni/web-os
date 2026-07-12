import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanupStaleRoomsHandler } from '../../features/billing/jobs/functions';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Watch Room Cleanup Job', () => {
  let mockSupabase: unknown;
  let mockRoomsSelect: import('vitest').Mock;
  let mockMembersSelect: import('vitest').Mock;
  let mockDelete: import('vitest').Mock;
  let mockLogger: {
    info: import('vitest').Mock;
    error: import('vitest').Mock;
    warn: import('vitest').Mock;
  };
  let mockStep: {
    run: import('vitest').Mock;
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockRoomsSelect = vi.fn();
    mockMembersSelect = vi.fn();
    mockDelete = vi.fn().mockResolvedValue({ error: null });

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'watch_rooms') {
          return {
            select: vi.fn().mockReturnThis(),
            lt: mockRoomsSelect,
            delete: vi.fn().mockReturnThis(),
            in: mockDelete,
          };
        }
        if (table === 'room_members') {
          return {
            select: vi.fn().mockReturnThis(),
            in: mockMembersSelect,
          };
        }
        return {};
      }),
    };

    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as ReturnType<typeof createSupabaseServiceRoleClient>);

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    mockStep = {
      run: vi.fn().mockImplementation((name, cb) => cb()),
    };
  });

  it('deletes empty rooms older than 24 hours', async () => {
    mockRoomsSelect.mockResolvedValue({
      data: [{ id: 'room_stale_1' }, { id: 'room_stale_2' }],
      error: null,
    });

    mockMembersSelect.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await cleanupStaleRoomsHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.deletedCount).toBe(2);
    expect(mockDelete).toHaveBeenCalledWith('id', ['room_stale_1', 'room_stale_2']);
  });

  it('does not delete stale rooms that still have members', async () => {
    mockRoomsSelect.mockResolvedValue({
      data: [{ id: 'room_stale_1' }, { id: 'room_stale_2' }],
      error: null,
    });

    mockMembersSelect.mockResolvedValue({
      data: [{ room_id: 'room_stale_1' }],
      error: null,
    });

    const result = await cleanupStaleRoomsHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.deletedCount).toBe(1);
    expect(mockDelete).toHaveBeenCalledWith('id', ['room_stale_2']);
  });

  it('does nothing if there are no stale rooms', async () => {
    mockRoomsSelect.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await cleanupStaleRoomsHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.deletedCount).toBe(0);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
