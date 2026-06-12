---
description: Common AI mistakes in this codebase as ❌/✅ pairs, cross-referenced to the static rules that catch them.
when-to-load: Before writing feature code, Supabase access, or state logic — and when a review-gate rule fires.
---

# Common Mistakes

The static analyzer (`bun run ai:eval`) *catches* these; this doc helps you *avoid*
them. Rule ids in parentheses map to `scripts/check-review-gate-rules.mjs`.

## 1. State ownership (`query-result-in-zustand`)

Server data belongs in the TanStack Query cache, not Zustand.

❌
```ts
const { data } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
useEffect(() => { useProfileStore.getState().setProfile(data); }, [data]);
```

✅
```ts
const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
// Read `profile` directly. Zustand only holds client UI state (sidebar, modals).
```

## 2. Supabase select-all (`supabase-select-star`)

❌ `supabase.from('profiles').select('*')`
✅ `supabase.from('profiles').select('id, display_name, avatar_url')`

Explicit columns survive schema drift and make reviews meaningful.

## 3. Service-role in client code (`service-role-client`, P0)

❌ Importing the admin/service-role client into a `"use client"` component.
✅ Service-role lives in server-only code (`actions.ts`, route handlers,
`@pumni/auth`). Browser uses the `NEXT_PUBLIC_*` publishable key only.

## 4. RLS not enforced (`missing-auth-uid-policy`, P0)

❌ `create policy "all" on notes for all using (true);`
✅
```sql
alter table public.notes enable row level security;
create policy "owner reads" on public.notes for select
  to authenticated using (user_id = (select auth.uid()));
```
Follow `docs/conventions/supabase-security.md` — RLS + policies + grants in the
same migration.

## 5. Trusting a client-supplied user_id (`trusted-client-user-id-write`)

❌ Client component does `supabase.from('notes').insert({ user_id: userId, ... })`.
✅ Write through a Server Action that derives the owner from `auth.uid()`, or rely
on an RLS `WITH CHECK (user_id = auth.uid())` policy.

## 6. Mutation without cache update (`mutation-without-invalidation`)

❌ `useMutation({ mutationFn: updateProfile })` with no `onSuccess`/`onSettled`.
✅ Invalidate or set the precise query data on success:
```ts
useMutation({
  mutationFn: updateProfile,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
});
```

## 7. Logic in route files (`route-business-logic`)

❌ A `page.tsx` defining `useMutation`, calling external `fetch`, or running timers.
✅ Route files compose UI and read server data; behaviour lives in a feature hook
or `actions.ts`/`queries.ts` (`docs/conventions/feature-module.md`).

## 8. Missing loading state (`missing-loading-state`)

❌ Rendering `data.name` straight from `useQuery` while `data` may be undefined.
✅ Handle `isPending`/`isLoading` with a skeleton, placeholder, or early return.

## 9. Swallowed errors (`swallowed-error`)

❌ `try { await save(); } catch (e) {}` in `actions.ts`/`queries.ts`.
✅ Throw, return an explicit failure, or log before continuing.

## 10. Next.js 16 cache invalidation

❌ `revalidateTag('profile')`
✅ `revalidateTag('profile', 'max')` for stale-while-revalidate, or
`updateTag('profile')` inside Server Actions when users must read their own
writes immediately.

## 11. Instant navigation exports

❌ Adding `export const unstable_instant` to a `"use client"` route file.
✅ Export it only from Server Component route segments that should be validated
for instant navigation. Protected layouts should either put auth behind a local
Suspense boundary with a static fallback shell, or use
`export const unstable_instant = false` if they intentionally cannot be instant.
Never render protected children in the fallback shell before auth resolves.
