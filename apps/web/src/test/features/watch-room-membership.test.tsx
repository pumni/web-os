import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRoomMembership } from '@/features/watch/hooks/use-room-membership';
import { watchKeys } from '@/features/watch/query-keys';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRoomMembership', () => {
  it('joins the room and refetches member-gated data before marking membership ready', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useRoomMembership('room-1', queryClient));

    expect(result.current.isMemberReady).toBe(false);

    await waitFor(() => expect(result.current.isMemberReady).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/watch/room-1/join', { method: 'POST' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: watchKeys.queue('room-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: watchKeys.room('room-1') });
    expect(result.current.joinError).toBeNull();
    expect(result.current.isJoining).toBe(false);
  });

  it('sets joinError and triggers toast when join fails with 403 (Room Full)', async () => {
    const queryClient = new QueryClient();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Phòng đã đầy theo giới hạn gói của chủ phòng.' }),
    } as Response);

    const { toast } = await import('sonner');

    const { result } = renderHook(() => useRoomMembership('room-1', queryClient));

    await waitFor(() => expect(result.current.isJoining).toBe(false));

    expect(result.current.isMemberReady).toBe(false);
    expect(result.current.joinError?.message).toBe('Phòng đã đầy theo giới hạn gói của chủ phòng.');
    expect(toast.error).toHaveBeenCalledWith('Phòng đã đầy theo giới hạn gói của chủ phòng.');
    // Ensure no retries: fetch should have been called only once
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
