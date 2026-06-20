# Review Gate

Run this self-review on your own diff **before** reporting a task as done for any
change beyond pure copy/docs. The static rules are enforced by
`scripts/check-review-gate-rules.mjs` (run via `bun run ai:eval`) — that checker
is the authoritative rule list; ❌/✅ examples live in `docs/ai/common-mistakes.md`.
This checklist adds the **behavioural items a static analyzer cannot see**; each
`(static: id)` tag points at the rule that already covers it.

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

The 16 static rules (id, severity, summary, fix) are defined once in the
registry `scripts/review-gate-rules.mjs` — that file is the single source of
truth. `bun run ai:eval` enforces them; `docs/ai/common-mistakes.md` gives the
❌/✅ explanation of each. Read those — do not re-transcribe the rule table here.
