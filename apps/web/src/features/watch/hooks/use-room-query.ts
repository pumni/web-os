'use client';

import { useQuery } from '@tanstack/react-query';
import { watchKeys } from '../query-keys';
import type { Room } from '../types';
import { getRoomClient } from '../client-queries';

export const WATCH_ROOM_STALE_MS = 30_000;
// 5 minutes fallback: Prevents aggressive polling while active realtime channel delivers updates,
// but ensures recovery if the socket silently disconnects (e.g. dead NAT timeout) without terminal status.
export const WATCH_ROOM_RECOVERY_REFETCH_MS = 5 * 60_000;

export function useRoomQuery(roomId: string, initialData: Room) {
  return useQuery({
    queryKey: watchKeys.room(roomId),
    queryFn: () => getRoomClient(roomId, initialData),
    initialData,
    staleTime: WATCH_ROOM_STALE_MS,
    refetchInterval: WATCH_ROOM_RECOVERY_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
  });
}
