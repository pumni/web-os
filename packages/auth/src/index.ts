import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@pumni/supabase';
import { createSupabaseServerClient } from '@pumni/supabase/server';

/**
 * Resolve the request's identity from the access-token JWT claims.
 *
 * Uses `getClaims()` (local signature verification against cached JWKS when
 * asymmetric signing keys are enabled) instead of `getUser()`, which makes a
 * network round-trip to the Auth server on every call. `proxy.ts` already
 * refreshes the session per request, so the cookie JWT is fresh by the time a
 * Server Component reads it — keeping this off the navigation critical path.
 *
 * The claims carry the fields the UI consumes (`sub`, `email`, `user_metadata`,
 * `app_metadata`), so we project them onto the `User` shape callers expect.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const { claims } = data;

  return {
    id: claims.sub,
    aud: Array.isArray(claims.aud) ? (claims.aud[0] ?? '') : claims.aud,
    role: claims.role,
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
    // Not present in the JWT; the UI never reads it. Supplied to satisfy the type.
    created_at: '',
    // `email`/`phone` are optional on `User`; under exactOptionalPropertyTypes
    // they must be omitted (not set to `undefined`) when the claim is absent.
    ...(claims.email !== undefined ? { email: claims.email } : {}),
    ...(claims.phone !== undefined ? { phone: claims.phone } : {}),
  } satisfies Partial<User> as User;
});

export const verifySession = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return {
    isAuth: true,
    userId: user.id,
    user,
  };
});

export async function requireUser() {
  const { user } = await verifySession();

  return user;
}
