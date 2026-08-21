# Refinement Plan: SaaS Billing Platform — pre-Phase-3 acceptance remediation

> Historical and non-normative. This refinement record is retained for audit;
> verify all claims against current source before taking any action.

- **Status:** Ready for execution
- **Date:** 2026-07-12
- **Scope:** Bring the landed Phase 0–2 work (commit `e6d872d`, unpushed, **not yet applied to any remote DB**) to the best state before Phase 3 is authorised.
- **Sources:** `saas-billing-platform-2026-07-implementation.md` (the execution plan + corrections C1–C8); two AI acceptance reports (`Dưới đây là báo cáo nghiệm thu SaaS phase0-1.md`, `BÁO CÁO NGHIỆM THU — SaaS Billing P.md`); independent re-verification against the repo + the Polar SDK source (2026-07-12).
- **Audience:** AI coding sessions. Execute the items in order within each priority band. Each item is a self-contained work unit (context → files → change → tests → gate).

---

## 0. Decisions locked for this refinement (read first)

| # | Decision | Consequence |
|---|---|---|
| K1 | **Amend migrations 022–024 in place** (not add a corrective 025). User granted an explicit, one-time override of the "committed migrations are immutable" rule (AGENTS.md P2 / supabase-security), justified because `e6d872d` is unpushed **and** unapplied to every DB — the files are effectively still drafts. This override applies **only** to `022`–`024` within `e6d872d`; the immutability rule is otherwise intact. | The `can_create_room` fix edits `023` directly; 022/023/024 may be consolidated. |
| K2 | **Keep the return-`{ url }` + client `window.location.href` checkout pattern.** It is a valid, arguably safer alternative to the plan's server-side `redirect()` (no `NEXT_REDIRECT`-in-try/catch footgun). | No code change; the execution-plan text is updated to record it as an accepted deviation (item R11). |
| K3 | **Regenerate `packages/supabase/src/types.ts` from the local Supabase stack** and delete the hand-written `db-types.ts`. User confirmed the local stack can run. | Item R3 includes `supabase start` → `db reset` → `gen types`. |

---

## 1. Acceptance verdict (re-verified 2026-07-12)

| Phase | Verdict | Notes |
|---|---|---|
| **Phase 0 — Foundations** | **PASS** with one config gap | All 5 steps landed; gates green in both reports. Real gap: UPSTASH env vars bypass Zod (R1). |
| **Phase 1 — Billing core** | **CONDITIONAL** | Migration 022 + webhook route/handlers correct. Blockers: missing validators + tests, billing-action hardening, types regen (R2–R5). |
| **Phase 2 — Entitlements & gating** | **PASS** with one correctness bug | `getEntitlements`, RLS gating, UI correct. Real bug: `can_create_room` counts *total* rooms, not *active* per A3 (R6); missing quota test file (R7). |
| **P0 security** | **No violation** | Service-role key server-only; `server-only` on every billing module; `webhook_events` RLS-on/zero-policy; publishable-vs-secret split intact. Independently re-verified. |

### 1.1 Correction to the acceptance reports — the top-flagged blocker is a FALSE ALARM

Report 1 ranked **"`customer.externalId` (camelCase) vs `external_id` (snake_case) → every subscription event 500s → product death"** as blocker #1 (must-fix-before-productize). **This is not a real defect.** Verified against the vendored SDK (`@polar-sh/sdk@0.48.1`):

- `validateEvent` → `parseEvent` runs `<Payload>$inboundSchema.parse(parsed)` (Speakeasy Zod schemas), i.e. it **transforms the wire JSON to camelCase** before the handler ever sees it.
- `subscriptioncustomer.js:87` maps `"external_id" → "externalId"`; `subscription.js:185` maps `"product_id" → "productId"`; `status`, `current_period_end`, `cancel_at_period_end` are likewise camelCased.
- Therefore `webhook-handlers.ts` reading `sub.customer?.externalId`, `sub.productId`, `sub.status`, `sub.currentPeriodEnd`, `sub.cancelAtPeriodEnd` is **correct**.

The residual value of Step 1.5 (sandbox E2E) is confirming product-id ↔ tier mapping and idempotency end-to-end, **not** rescuing a broken field contract. Keep R10 (E2E) but downgrade it from "product-critical" to "release-gate confidence check".

---

## 2. Priority 0 — correctness & contract blockers (must clear before Phase 3)

### R1 — UPSTASH env vars through Zod (Step 0.3 gap; report 2 §Critical-1)

- **Skill:** `zod-validator`
- **Verified:** `rate-limit.ts:15-16` reads `process.env.UPSTASH_REDIS_REST_URL/TOKEN` directly; neither is in `server-schema.ts`. (Report 1 wrongly marked this present — report 2 is correct.)

**Change**
- `packages/env/src/server-schema.ts`: add `UPSTASH_REDIS_REST_URL: z.url().optional()`, `UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()` (matches C2's optional-for-new-vars rule).
- `apps/web/src/shared/lib/rate-limit.ts`: read `serverEnv.UPSTASH_REDIS_REST_URL / _TOKEN` instead of `process.env`. Keep the fail-open no-op + one-time warn when either is absent.

**Test:** extend `rate-limit.test.ts` with the missing-env → no-op path (both reports note this case is untested today).

**Gate:** `bun --filter @pumni/env typecheck` + `bun --filter web test`.

### R2 — Billing validators schema + test (Step 1.4 deliverable; both reports)

- **Skill:** `zod-validator`
- **Verified:** `packages/validators/src/` has only `auth/profile/watch`; no `billing.ts`. Actions type the args inline with no runtime validation.

**Change**
- Create `packages/validators/src/billing.ts`:
  ```ts
  export const checkoutSchema = z.object({ tier: z.enum(['pro','max']), interval: z.enum(['monthly','yearly']) });
  export type CheckoutInput = z.infer<typeof checkoutSchema>;
  ```
- Export from `packages/validators/src/index.ts`.
- Create `apps/web/src/test/validators/billing.test.ts` (valid + each invalid-enum case).

**Gate:** `bun --filter @pumni/validators typecheck` + `bun --filter web test`.

### R3 — Regenerate Supabase types; delete `db-types.ts` (Step 1.1 gate; both reports; K3)

- **Skill:** `supabase-migration` (regen is part of the migration flow)
- **Verified:** `packages/supabase/src/types.ts` has no billing tables; `apps/web/src/features/billing/db-types.ts` (143 LOC hand-written `BillingDatabase extends Database`) exists; consumers cast `as unknown as SupabaseClient<BillingDatabase>`. No `bun` script generates types.

**Change (do R6 first so the regen captures the corrected function):**
1. `supabase start` → `supabase db reset` (applies 001–024 locally).
2. `supabase gen types typescript --local > packages/supabase/src/types.ts` (never hand-edit the output).
3. Delete `apps/web/src/features/billing/db-types.ts`.
4. Remove every `as unknown as SupabaseClient<BillingDatabase>` cast in `webhook-handlers.ts`, `queries.ts`, `actions.ts` — the generated `Database` now carries `plans`/`billing_customers`/`subscriptions`/`webhook_events` and the 3 functions, so the standard client types resolve.

**Gate:** `bun --filter web typecheck` + `bun --filter web test` + `bun --filter @pumni/supabase typecheck`.

### R4 — Harden billing actions (Step 1.4 contract; both reports)

- **Skill:** `server-action`
- **Verified:** `actions.ts` `createCheckoutSession`/`createPortalSession` lack `parseActionInput`, `withRateLimit`, `Sentry.withServerActionInstrumentation`, and `customerIpAddress`.

**Change** — both actions follow the contract order `requireUser()` → `parseActionInput(checkoutSchema, …)` (checkout only) → `withRateLimit(\`billing:${user.id}\`, …)` → body wrapped in `Sentry.withServerActionInstrumentation('<name>', …)`:
- Validate `createCheckoutSession` input with `checkoutSchema` (R2) via `parseActionInput`.
- Wrap both bodies in `withRateLimit(\`billing:${user.id}\`, …)`.
- Wrap in `Sentry.withServerActionInstrumentation` (research §2.3).
- `createCheckoutSession`: pass `customerIpAddress` from `(await headers()).get('x-forwarded-for')?.split(',')[0]?.trim()` (research §1.8) — read `headers()` **before** any cache scope.
- **Do not** change the return shape (K2): still return `ActionResult<{ url: string }>`.

**Tests:** extend `billing-actions.test.ts` — invalid input → localized failure; rate-limited (inject `setLimiter` returning `success:false`) → 429 message; unauthenticated → `requireUser` throws. Keep the existing Polar-error + no-customer cases.

**Gate:** `bun --filter web test` + `bun --filter web lint typecheck`.

### R5 — Webhook handler-error → 500 test (invariant #8; both reports note the gap)

- **Skill:** `testing-template`

**Change:** add a case to `webhook-handlers.test.ts`: a handler dependency (e.g. `subscriptions.upsert`) errors → `webhook_events.error` is set and `{ status: 500 }` returned. Confirms invariant #8 (currently only the success/duplicate/unknown-product paths are covered).

**Gate:** `bun --filter web test`.

### R6 — Fix `can_create_room` "active" definition (Step 2.2 / A3; report 1 D10) + single source of truth

- **Skill:** `supabase-migration` (mandatory) + `supabase-rls-reviewer` subagent pass on the diff
- **Verified:** `023:20-22` counts `count(*) from watch_rooms where host_id = p_user` — **no active filter**. The TS pre-check `createRoom` (`watch/actions.ts:148-151`) has the *same* unfiltered count. They agree with each other but both violate plan A3 (a free user who ever created one room — even long-abandoned/empty — is blocked forever).

**Change (per K1 — amend `023` in place):**
- Recreate `private.can_create_room` counting only **active** owned rooms per A3:
  ```sql
  select count(*) into v_current_rooms
  from public.watch_rooms r
  where r.host_id = p_user
    and (
      r.last_active_at > now() - interval '24 hours'
      or exists (select 1 from public.room_members m where m.room_id = r.id)
    );
  ```
  Keep `security definer`, `set search_path = public, private`, `stable`, and the revoke-then-grant execute block verbatim. `can_join_room` (024) is unchanged — member-cap counting is already correct.
- **Make SQL the single source of truth (C6 spirit):** the RLS function now decides. In `createRoom`, replace the TS pre-check count block with the **C8 42501 mapping**: attempt the insert; on `error.code === '42501'` return the localized quota message
  `'Bạn đã đạt giới hạn phòng đang hoạt động của gói hiện tại. Nâng cấp để tạo thêm phòng.'`
  Remove the now-redundant `getEntitlementsForUser` + count pre-check so there is **one** active-room definition, not two that can drift (this was the exact tier/product-drift risk the plan flagged). Leave the `limit_hit` analytics hook point as a comment for Phase 3.3.
  - *If* a pre-check is retained for UX (not recommended), its query **must** use the identical active filter above — do not leave the unfiltered count.

**Tests:** create `apps/web/src/test/features/watch-quota-messages.test.ts` (R7) covering the 42501 path. Update `billing-rls-migration.test.ts` / any 023 static assertion so it asserts `can_create_room` contains the `last_active_at` / `room_members` active clause.

**Gate:** `supabase-rls-reviewer` subagent on the migration diff + `bun --filter web test`. Then regenerate types (R3).

### R7 — Missing `watch-quota-messages.test.ts` (Step 2.3 deliverable; both reports)

- **Skill:** `testing-template`
- **Verified:** file absent; criterion-6 app-half is only partially covered (membership 403 tested in `watch-room-membership.test.tsx`, but the `createRoom` 42501 path is not).

**Change:** create `apps/web/src/test/features/watch-quota-messages.test.ts`:
- `createRoom` insert returns `{ code: '42501' }` → localized quota message (post-R6).
- `createRoom` insert returns a non-policy error → generic `actionFailure` message (proves 42501 isn't over-matched).
- Re-assert the membership path: `ensureRoomMembership` 42501 → `RoomFullError` → join route 403 (may reuse/extend the existing membership test).

**Gate:** `bun --filter web test`.

---

## 3. Priority 1 — process & close-step gaps (clear before opening the phase PRs)

### R8 — Consolidate migration files to match spec (optional under K1; report 2 §Critical-4)

Plan specified a single `023_watch_room_quotas.sql`; the impl split it into `023_watch_rooms_limit_rls.sql` + `024_watch_room_members_limit.sql`. Under K1 you may **either** merge 024 into 023 (delete 024, renumber nothing else — 024 is the last file) to match the spec, **or** keep the split and record the deviation in the execution plan (item R11). Recommendation: **merge**, since it's free while unapplied and keeps the migration list aligned with the doc. Re-run the `supabase-rls-reviewer` pass after merging.

### R9 — Phase-close doc sweep (Phase 1 & 2 close steps; both reports; matches SessionStart drift notice)

The drift notice at session start flags exactly these owner docs as stale. Update in the **same** change as the code they document:
- `docs/conventions/supabase-security.md` — service-role exception addendum: `webhook-handlers.ts`, `shared/lib/audit.ts`, and `billing/queries.ts` (`getEntitlements`) are the sanctioned service-role writers/readers for billing.
- `docs/conventions/nextjs-16.md` — route-handler `revalidateTag(tag, 'max')` example (the two-arg form the webhook uses).
- `docs/ai/golden-examples.md` — the Polar webhook route as the reference idempotent-webhook pattern.
- `.agents/skills/supabase-migration/SKILL.md`, `docs/conventions/feature-module.md`, `docs/conventions/testing.md`, `docs/conventions/server-client-boundary.md` — only if the R1–R7 changes alter documented behavior; otherwise leave.
- Run `bun run ai:graph:sync` + `bun run ai:adr:sync` + `bun run ai:nav:sync` and `bun run ai:check` after.

### R10 — Sandbox end-to-end (Step 1.5; both reports) — confidence gate, not product-critical (see §1.1)

Run `bun run dev` + Polar sandbox + webhook tunnel. Verify: checkout → sandbox payment → webhook 200 → `subscriptions` row with correct tier/status → `webhook_events.processed_at` set → `audit_events` row → tier reflected by `getEntitlements`. Redeliver the same event from the Polar dashboard → still one row each (idempotency). Record the observed rows in the PR description. Primary goal now: confirm **product-id ↔ tier** mapping for the 4 sandbox products and idempotency — the field-casing question is already resolved (§1.1).

### R11 — Reconcile the execution plan with accepted deviations

Edit `saas-billing-platform-2026-07-implementation.md` so the spec and the code agree (avoids future "drift" churn). Record as accepted: return-`{url}` checkout (K2); action names `createCheckoutSession`/`createPortalSession` (vs `startCheckout`/`openCustomerPortal`); test file `billing-queries.test.ts` (vs `billing-entitlements.test.ts`); reuse of `settings/account/page.tsx` in place of a separate `billing/page.tsx` (confirm this is intended — if a dedicated `/billing` route is still wanted, that's a small add, otherwise document the reuse). Correct the plan's `revalidateTag(tag, { expire: 0 })` to `revalidateTag(tag, 'max')` to match `docs/conventions/nextjs-16.md`.

---

## 4. Priority 2 — nice-to-have (safe to defer into Phase 3, do not block)

- **N1** Sentry config guard: add `if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;` at the top of the 3 init files to silence the empty-DSN warning in local dev.
- **N2** Webhook idempotency: replace the select-then-insert + `23505` fallback with the atomic `insert(...).onConflictDoNothing().select('id').maybeSingle()` from the plan (functionally equivalent today; simpler + one fewer round-trip). Also switch the existence `select` from `.single()` to `.maybeSingle()`.
- **N3** Audit wire-site assertions: assert `recordAuditEvent` is actually called from `updateProfile` / `createRoom` / `transferHost` (criterion 8 is currently "partial").
- **N4** Tunable per-key rate limits (currently a single `slidingWindow(10,'1m')` singleton for all keys). Fine for MVP.
- **N5** `MEMORY.md` currently says "Phase 0–2 landed" — refine to reflect the R1–R10 remediation state so it isn't read as fully-accepted.

---

## 5. Verification gates before Phase 3 is authorised

Run in this order; every one must be green and **recorded** (the acceptance reports found none of these were evidenced):

1. `bun --filter web lint` · `bun --filter web typecheck` · `bun --filter web test`
2. `bun --filter @pumni/env typecheck` · `bun --filter @pumni/validators typecheck` · `bun --filter @pumni/supabase typecheck`
3. `bun run build` (Step 0.2 gate — never run; bundle-affecting Sentry/route changes make it mandatory)
4. `bun run ai:check` + `bun run ai:eval` (security/arch surfaces were touched — env, RLS, service-role)
5. `supabase-rls-reviewer` subagent on the final 022–024 diff — record the verdict in the PR
6. R10 sandbox E2E log in the PR description
7. `bun run ai:premerge` (full ladder) — the phase-close gate, never run in either report

---

## 6. Acceptance criteria → remediation map

| # | Criterion | Status after this plan | Item |
|---|---|---|---|
| 1 | No raw driver messages from actions | already met | — |
| 2 | 429 on rate-limited paths | closed for billing actions | R4 |
| 3 | Webhook idempotency | met (optional simplify) | N2 |
| 4 | Invalid signature → 401 before writes | met | — |
| 5 | Tier flip via `entitlements:{userId}`; RLS blocks (cap+1)-th **active** room | corrected | R6 |
| 6 | Member cap + localized message | test coverage closed | R7 |
| 7 | Cross-user billing isolation; no authenticated writes | met; verifier-signed | R6 gate |
| 8 | Audit rows on billing + host transfer | met (assertions optional) | N3 |
| 9 | Secrets server-only; `server-only` on billing modules | met | — |
| 10 | Reconciliation converges DB → Polar | Phase 3 scope | — |

---

## 7. Suggested PR grouping

Keep one logical change per commit (AGENTS.md). Natural grouping:
- **PR-A (Phase 0/1 hardening):** R1, R2, R4, R5 + tests.
- **PR-B (schema correctness):** R6 (+R8 consolidation), then R3 (types regen) — must land together since R3 regenerates from the corrected R6 function.
- **PR-C (docs & reconciliation):** R9, R11, N5.
- R10 is a manual gate recorded in whichever PR carries the webhook path (PR-A or PR-B).

Do not begin Phase 3 (Inngest / Resend / PostHog) until §5 gates are green and the `supabase-rls-reviewer` verdict on 022–024 is recorded.
