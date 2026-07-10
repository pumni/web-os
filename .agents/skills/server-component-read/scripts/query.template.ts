// query.template.ts — copy into features/<feature>/queries.ts, rename, fill in.
//
// Skeleton for a P0-safe Server Component read: request-scoped user via
// requireUser(), userId passed into the CACHED function (so the cache key
// includes it), 'use cache' in the fetching body (never in a wrapper/HOF),
// parameterized cacheTag, cacheLife 'minutes' minimum, explicit columns,
// explicit not-found handling (PGRST116).

import { unstable_cacheTag as cacheTag, unstable_cacheLife as cacheLife } from 'next/cache';
import { requireUser } from '@pumni/auth/server';
import { getServiceRoleClient } from '@pumni/supabase/server';

// The cached function does the fetch; 'use cache' must be in THIS body.
async function fetchThing(userId: string, thingId: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(`thing:${userId}:${thingId}`); // parameterized per user + resource

  const supabase = getServiceRoleClient();
  const single = supabase
    .from('things')
    .select('id, user_id, name, created_at') // explicit columns — never select('*')
    .eq('id', thingId)
    .eq('user_id', userId)
    .maybeSingle();

  const { data, error } = await single;
  // PGRST116 = expected empty row, not a throw.
  return data ?? null;
}

// Outer wrapper derives the user once per request, passes userId in.
export async function getThing(thingId: string) {
  const { id: userId } = await requireUser();
  return fetchThing(userId, thingId);
}
