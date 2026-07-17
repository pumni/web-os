---
description: Common AI mistakes in this codebase as ❌/✅ pairs, cross-referenced to the static rules that catch them. Use before writing feature code, Supabase access, or state logic — and when a review-gate rule fires.
---

# Common Mistakes

`bun run ai:eval` _catches_ these; this doc helps you _avoid_ them. Rule ids
are defined in `scripts/review-gate-rules.mjs`. Unlabeled = enforced;
`(partial)` or `(honor-system)` = not fully automated.

## 1. State ownership (`query-result-in-zustand`)

❌ `useEffect(() => useProfileStore.getState().setProfile(data), [data])` after `useQuery`
✅ Read directly from `useQuery`; Zustand is for client UI only (`docs/conventions/data-fetching.md`).

## 2. Supabase select-all (`supabase-select-star`)

❌ `supabase.from('profiles').select('*')`
✅ `supabase.from('profiles').select('id, display_name, avatar_url')`

## 3. Service-role in client code (`service-role-client`, P0)

❌ Importing admin/service-role client into a `"use client"` component.
✅ Admin client lives in server-only code. Browser uses publishable keys only. Server modules importing service-role must be on the `service-role-import-allowlist`.

## 4. RLS not enforced (`missing-auth-uid-policy`, P0)

❌ `create policy "all" on notes for all using (true);`
✅ Enable RLS; check `user_id = auth.uid()` (see `docs/conventions/supabase-security.md`).

## 5. Trusting a client-supplied user_id (`trusted-client-user-id-write`)

❌ Client component inserts `{ user_id: userId, ... }`.
✅ Server Action derives owner from `auth.uid()`, or RLS uses `WITH CHECK (user_id = auth.uid())`.

## 6. Mutation without cache update (`mutation-without-invalidation`)

❌ `useMutation({ mutationFn: updateProfile })` with no cache refresh.
✅ client: `onSuccess: () => queryClient.invalidateQueries(...)`; server: call `router.refresh()` / `updateTag` on action success.

## 7. Logic in route files (`route-business-logic`)

❌ A `page.tsx` defining `useMutation`, calling external `fetch`, or running timers.
✅ Route files compose UI; behavior lives in feature actions/queries (`docs/conventions/feature-module.md`).

## 8. Missing loading state (`missing-loading-state`)

❌ Rendering `data.name` straight from `useQuery` while `data` may be undefined.
✅ Handle `isPending`/`isLoading` with a skeleton, placeholder, or early return.

## 9. Swallowed errors (`swallowed-error`)

❌ `try { await save(); } catch (e) {}` in `actions.ts`/`queries.ts`.
✅ Throw, return an explicit failure, or log before continuing.

## 10. Next.js 16 cache & tags (`cache-life-too-short`, `cache-tag-unparameterized`, `use-cache-placement`, `update-tag-scope`, `single-arg-revalidate-tag`)

SSOT: `docs/conventions/nextjs-16.md` (enforced by static check).

Includes: `cacheLife` minimums, parameterized `cacheTag`, `'use cache'` placement,
`updateTag` Server-Action-only scope, and two-arg `revalidateTag(tag, profile)`.

## 11. Weakening a test to make it pass (`test-weakening`)

❌ `describe.only`/`it.skip` or swallowing exceptions to silence a throw.
✅ Fix code; assert with `toThrow()`. Skip goes to `ai-review-rule-allowlist.json`.

## 12. Legacy middleware (`legacy-middleware`)

❌ Implementing routing or auth check inside App Router `middleware.ts`.
✅ Use Node-based auth proxy at `apps/web/src/proxy.ts` (or equivalent).
## 13. Server-only leaks (`server-only-in-client`, `server-action-missing-auth`, `server-action-missing-revalidation`)

❌ Importing `"server-only"` in client code, or actions missing auth check / tag updates.
✅ Server-only stays on server; authenticate actions via `requireUser()`; run `updateTag(tag)`.

## 14. Premature abstraction (simplicity) (honor-system)

❌ A strategy/factory/registry for one case; interface with one impl.
✅ Minimum code for today's task; add abstraction when a second caller appears.

## 15. Upsert conflict target is not the row identity (honor-system)

❌ `onConflict: 'provider,provider_customer_id'` when the PK is `user_id` — a changed provider id hits the PK, not the declared target, so Postgres raises 23505 instead of updating.
✅ Conflict on the column that identifies the row (`onConflict: 'user_id'`).

## 16. Quota counted in a separate precheck (honor-system)

❌ `stable` fn counts rows, returns `count < limit`; RLS inserts after — racing requests all pass.
✅ `pg_advisory_xact_lock` on the contended key + `volatile`, so the recount sees committed rows. `stable` reuses the caller's snapshot, so the lock alone is not enough (migration `024`).

