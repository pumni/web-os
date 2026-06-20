'use client';

import { useEffect, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { watchKeys } from '../query-keys';

interface RoomMembershipState {
  isJoining: boolean;
  isMemberReady: boolean;
  joinError: Error | null;
}

interface InternalRoomMembershipState extends RoomMembershipState {
  roomId: string;
}

function createInitialState(roomId: string): InternalRoomMembershipState {
  return {
    roomId,
    isJoining: true,
    isMemberReady: false,
    joinError: null,
  };
}

/**
 * Registers the current user as a room member, then refetches member-gated
 * room data. Queue reads/writes depend on this membership row passing RLS.
 */
export function useRoomMembership(roomId: string, queryClient: QueryClient): RoomMembershipState {
  const [state, setState] = useState<InternalRoomMembershipState>(() => createInitialState(roomId));

  useEffect(() => {
    let cancelled = false;

    async function join(attempt = 0) {
      try {
        const res = await fetch(`/api/watch/${roomId}/join`, { method: 'POST' });
        if (!res.ok) throw new Error(`join failed: ${res.status}`);
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: watchKeys.queue(roomId) });
        await queryClient.invalidateQueries({ queryKey: watchKeys.room(roomId) });
        if (!cancelled) {
          setState({ roomId, isJoining: false, isMemberReady: true, joinError: null });
        }
      } catch (err) {
        if (cancelled) return;
        if (attempt < 3) {
          setTimeout(() => void join(attempt + 1), 1000 * (attempt + 1));
          return;
        }

        const joinError = err instanceof Error ? err : new Error('join failed');
        console.error('Failed to join room after retries', joinError);
        toast.error(
          'Không thể tham gia phòng. Một số thao tác có thể bị hạn chế — hãy tải lại trang.',
        );
        setState({ roomId, isJoining: false, isMemberReady: false, joinError });
      }
    }

    void join();
    return () => {
      cancelled = true;
    };
  }, [roomId, queryClient]);

  if (state.roomId !== roomId) {
    return createInitialState(roomId);
  }

  return state;
}
