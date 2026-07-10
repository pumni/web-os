// action.template.ts — copy into features/<feature>/actions.ts, rename, fill in.
//
// Skeleton for a P0-safe Server Action: "use server", Zod safeParse,
// server-derived auth via requireUser(), explicit result shape, cache
// invalidation via updateTag/revalidateTag matching the read's cacheTag.
// Never trust a client-sent userId; never call the cache helpers from a
// route handler (they throw there).

'use server';

import { unstable_cacheTag as cacheTag, unstable_updateTag as updateTag } from 'next/cache';
import { z } from 'zod';
// schema lives in @pumni/validators — single source of truth across form/action/test.
import { <thing>InputSchema } from '@pumni/validators';
import { requireUser } from '@pumni/auth/server';
import { getServiceRoleClient } from '@pumni/supabase/server';

export async function update<Thing>(input: z.infer<typeof <thing>InputSchema>) {
  const user = await requireUser(); // server-derived — never trust input.userId
  const parsed = <thing>InputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().formErrors };
  }
  const supabase = getServiceRoleClient(); // service role is server-only
  const { error } = await supabase
    .from('<thing>')
    .update(parsed.data)
    .eq('id', parsed.data.id)
    .eq('user_id', user.id); // RLS re-check + belt-and-braces

  if (error) return { ok: false as const, error: error.message };

  // Tag must match the read's `cacheTag(`thing:${user.id}`)` exactly.
  updateTag(`thing:${user.id}`);
  return { ok: true as const, data: parsed.data };
}
