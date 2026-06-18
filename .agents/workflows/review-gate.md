# Review Gate

Run this self-review on your own diff **before** reporting a task as done for any
change beyond pure copy/docs. It mirrors the automated checks in
`scripts/check-review-gate-rules.mjs` (run via `bun run ai:eval`) plus the
behavioural items a static analyzer cannot see.

Report the result in the `## Risks / follow-up` section of your final response.
If any **P0** item fails, stop and fix before doing anything else.

## P0 — Security (blocking, immutable)

- [ ] No RLS bypass; access control relies on Row Level Security, not UI hiding.
- [ ] Service-role / secret key appears only in server-only code, never in a
      `"use client"` file or browser client. _(static: `service-role-client`)_
- [ ] Client files read only `NEXT_PUBLIC_*` environment variables and never
      import server-only auth/env/Supabase modules. _(static:
      `client-secret-env`, `server-only-in-client`)_
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`: RLS
      enabled, owner predicate uses `auth.uid()`. _(static: `missing-auth-uid-policy`,
      `rpc-user-id-without-auth-check`)_
- [ ] No secrets committed. _(static: `bun run ai:secrets`)_

## Architecture & state

- [ ] Server state stays in Server Components / TanStack Query; nothing mirrors
      query data into Zustand. _(static: `query-result-in-zustand`)_
- [ ] Zustand holds client UI state only. _(`docs/conventions/data-fetching.md`)_
- [ ] Mutations define an invalidation / cache-update strategy.
      _(static: `mutation-without-invalidation`)_
- [ ] Mutating Server Actions derive the current user server-side before any
      Supabase write. _(static: `server-action-missing-auth`)_
- [ ] Mutating Server Actions refresh the relevant Next.js cache tag/path or
      redirect after the write. _(static: `server-action-missing-revalidation`)_
- [ ] Supabase reads use explicit column projections, not `select('*')`.
      _(static: `supabase-select-star`)_
- [ ] App Router route files compose UI; business logic lives in feature hooks /
      `actions.ts` / `queries.ts`. _(static: `route-business-logic`)_
- [ ] Client-side writes never trust a client-supplied `user_id`.
      _(static: `trusted-client-user-id-write`)_
- [ ] Imports respect package boundaries in `docs/architecture/overview.md`.

## Quality

- [ ] Components using `useQuery` handle loading state. _(static: `missing-loading-state`)_
- [ ] Errors in server I/O are propagated, returned, or logged — not swallowed.
      _(static: `swallowed-error`)_
- [ ] Tests cover the happy path **and** at least one failure path.
      _(`docs/conventions/testing.md`)_

## Verification actually run

- [ ] `bun run ai:check` and `bun run ai:eval` pass.
- [ ] Relevant code gates pass: `bun run typecheck`, `bun run lint`, `bun run test`,
      and `bun run build` when the change can affect the bundle.
- [ ] Diff is scoped to the task; no unrelated working-tree changes bundled in.

## Static Rule Inventory

| id                                   | severity | summary                                                                              | Scenario                                                                             |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `supabase-select-star`               | B1       | Supabase reads must use explicit projection columns.                                 | Retrieve specific columns to survive schema drift.                                   |
| `service-role-client`                | P0       | Service-role and secret Supabase credentials must never enter client bundles.        | Add interactive UI without leaking server secrets/clients.                           |
| `trusted-client-user-id-write`       | B1       | Client writes must not trust client-supplied user_id values.                         | Ensure client-side mutations do not spoof user_id.                                   |
| `swallowed-error`                    | B1       | Server I/O errors must be propagated, returned, or logged.                           | Prevent silent server-side database failures.                                        |
| `missing-auth-uid-policy`            | B1       | User-owned RLS policies must include an auth.uid() owner predicate.                  | Add user-owned table protected by owner RLS policies.                                |
| `rpc-user-id-without-auth-check`     | B1       | RPC functions accepting p_user_id must compare it to auth.uid().                     | Secure RPC endpoints against user ID spoofing.                                       |
| `mutation-without-invalidation`      | B2       | TanStack Query mutations must refresh or update affected cached data.                | Invalidate or update query cache after data mutations.                               |
| `query-result-in-zustand`            | B1       | TanStack Query result data must not be mirrored into Zustand stores.                 | Keep query cache and Zustand stores separated.                                       |
| `missing-loading-state`              | B2       | Client components using useQuery must render a loading or pending state.             | Render skeleton/spinner while data is pending.                                       |
| `route-business-logic`               | B2       | App Router route files should compose UI, not own mutations or ad-hoc network logic. | Keep route files thin, delegate logic to features.                                   |
| `server-action-missing-auth`         | B1       | Server Actions that write through Supabase must derive the user server-side first.   | Authorize Server Action writes via server-side session checks.                       |
| `server-action-missing-revalidation` | B2       | Mutating Server Actions must invalidate or update Next.js cache state.               | Invalidate cached tag/path in Next.js Server Actions.                                |
| `client-secret-env`                  | B1       | Client files must only read NEXT_PUBLIC_* environment variables.                    | Prevent reading backend-only env vars on client.                                     |
| `server-only-in-client`              | B1       | Client files must not import server-only auth, env, or Supabase server modules.      | Keep server-only packages out of client bundles.                                     |
| `cache-life-too-short`               | B2       | `cacheLife('seconds')` punches a dynamic hole in the PPR static shell.               | Keep static cache duration above dynamic threshold.                                  |
| `cache-tag-unparameterized`          | B1       | `cacheTag('literal')` with no parameter collides across users/scopes.                | Parameterize cache tags to avoid cross-user collisions.                              |
