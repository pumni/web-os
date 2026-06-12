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
      `"use client"` file or browser client. *(static: `service-role-client`)*
- [ ] Client files read only `NEXT_PUBLIC_*` environment variables and never
      import server-only auth/env/Supabase modules. *(static:
      `client-secret-env`, `server-only-in-client`)*
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`: RLS
      enabled, owner predicate uses `auth.uid()`. *(static: `missing-auth-uid-policy`,
      `rpc-user-id-without-auth-check`)*
- [ ] No secrets committed. *(static: `bun run ai:secrets`)*

## Architecture & state

- [ ] Server state stays in Server Components / TanStack Query; nothing mirrors
      query data into Zustand. *(static: `query-result-in-zustand`)*
- [ ] Zustand holds client UI state only. *(`docs/conventions/data-fetching.md`)*
- [ ] Mutations define an invalidation / cache-update strategy.
      *(static: `mutation-without-invalidation`)*
- [ ] Mutating Server Actions derive the current user server-side before any
      Supabase write. *(static: `server-action-missing-auth`)*
- [ ] Mutating Server Actions refresh the relevant Next.js cache tag/path or
      redirect after the write. *(static: `server-action-missing-revalidation`)*
- [ ] Supabase reads use explicit column projections, not `select('*')`.
      *(static: `supabase-select-star`)*
- [ ] App Router route files compose UI; business logic lives in feature hooks /
      `actions.ts` / `queries.ts`. *(static: `route-business-logic`)*
- [ ] Client-side writes never trust a client-supplied `user_id`.
      *(static: `trusted-client-user-id-write`)*
- [ ] Imports respect package boundaries in `docs/architecture/overview.md`.

## Quality

- [ ] Components using `useQuery` handle loading state. *(static: `missing-loading-state`)*
- [ ] Errors in server I/O are propagated, returned, or logged — not swallowed.
      *(static: `swallowed-error`)*
- [ ] Tests cover the happy path **and** at least one failure path.
      *(`docs/conventions/testing.md`)*

## Verification actually run

- [ ] `bun run ai:check` and `bun run ai:eval` pass.
- [ ] Relevant code gates pass: `bun run typecheck`, `bun run lint`, `bun run test`,
      and `bun run build` when the change can affect the bundle.
- [ ] Diff is scoped to the task; no unrelated working-tree changes bundled in.

## Static Rule Inventory

| id | severity | summary |
| --- | --- | --- |
| `supabase-select-star` | B1 | Supabase reads must use explicit projection columns. |
| `service-role-client` | P0 | Service-role and secret Supabase credentials must never enter client bundles. |
| `trusted-client-user-id-write` | B1 | Client writes must not trust client-supplied user_id values. |
| `swallowed-error` | B1 | Server I/O errors must be propagated, returned, or logged. |
| `missing-auth-uid-policy` | B1 | User-owned RLS policies must include an auth.uid() owner predicate. |
| `rpc-user-id-without-auth-check` | B1 | RPC functions accepting p_user_id must compare it to auth.uid(). |
| `mutation-without-invalidation` | B2 | TanStack Query mutations must refresh or update affected cached data. |
| `query-result-in-zustand` | B1 | TanStack Query result data must not be mirrored into Zustand stores. |
| `missing-loading-state` | B2 | Client components using useQuery must render a loading or pending state. |
| `route-business-logic` | B2 | App Router route files should compose UI, not own mutations or ad-hoc network logic. |
| `server-action-missing-auth` | B1 | Server Actions that write through Supabase must derive the user server-side first. |
| `server-action-missing-revalidation` | B2 | Mutating Server Actions must invalidate or update Next.js cache state. |
| `client-secret-env` | B1 | Client files must only read NEXT_PUBLIC_* environment variables. |
| `server-only-in-client` | B1 | Client files must not import server-only auth, env, or Supabase server modules. |
