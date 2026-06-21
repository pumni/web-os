'use client';

import { useQuery } from '@tanstack/react-query';
import { getMemberProfilesClient } from '../client-queries';

export function useMemberProfiles(userIds: string[]) {
  const sorted = [...new Set(userIds)].sort();
  return useQuery({
    queryKey: ['watch', 'profiles', sorted],
    enabled: sorted.length > 0,
    staleTime: 60_000,
    queryFn: () => getMemberProfilesClient(sorted),
  });
}
