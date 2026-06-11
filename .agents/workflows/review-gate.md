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
