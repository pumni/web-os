'use client';

import { useQuery } from '@tanstack/react-query';
import { watchKeys } from '../query-keys';
import type { Room } from '../types';
import { getRecentRoomsClient } from '../client-queries';

export function useRecentRoomsQuery(initialData: Room[]) {
  return useQuery({
    queryKey: watchKeys.recentRooms(),
    queryFn: getRecentRoomsClient,
    initialData,
    staleTime: 30_000,
  });
}
