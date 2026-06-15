'use client';

import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';

export interface MemberProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export function useMemberProfiles(userIds: string[]) {
  const sorted = [...new Set(userIds)].sort();
  return useQuery({
    queryKey: ['watch', 'profiles', sorted],
    enabled: sorted.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_ids: sorted,
      });
      if (error) throw error;
      const map: Record<string, MemberProfile> = {};
      for (const p of (data ?? []) as MemberProfile[]) {
        map[p.id] = p;
      }
      return map;
    },
  });
}
