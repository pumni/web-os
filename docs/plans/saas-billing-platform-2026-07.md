# Plan: SaaS billing platform (Polar, tiered entitlements, watch-room gating)

- **Status:** Proposed (spec confirmed via grill-requirements 2026-07-10)
- **Date:** 2026-07-10
- **Owner:** backend platform (`packages/*` + `apps/web/src/features/billing` + `supabase/migrations`)
- **Skills used:** `grill-requirements` (this spec) → per-slice routing to
  `supabase-migration`, `server-action`, `server-component-read`,
  `zod-validator`, `feature-module`, `testing-template`, `domain-modeling`
- **Research basis:** repo backend audit 2026-07-10 (migrations 001–021,
  `@pumni/auth|env|supabase`, feature actions/queries, proxy, route handlers);
  2026 provider landscape (Polar vs Paddle vs Lemon Squeezy MoR; Stripe not
  available to VN merchants); Stripe/Polar webhook idempotency guidance.

---

## Outcome (one sentence)

Extend the existing RLS-first Supabase backend into a revenue-ready SaaS by
adding four missing organs — observability/rate-limit foundations, a
Polar-backed billing core with idempotent webhooks, a tiered entitlement layer
enforced in Postgres, and operational plumbing (jobs, email, analytics) — with
watch-room limits as the first end-to-end paid feature.

---

## Decisions locked (grill session 2026-07-10)

| #   | Decision            | Choice                                                                                                                                                                                                             |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Payment provider    | **Polar** (Merchant of Record; handles global VAT/tax; supports VN-based merchant). Schema stays **provider-agnostic** (`provider` discriminator column) so PayOS/VN gateway can be added later without migration. |
| D2  | Packaging           | **Three tiers: `free` / `pro` / `max`**, monthly + yearly prices per paid tier. Entitlements are per-feature + per-quota, resolved from tier.                                                                      |
| D3  | Tenancy             | **Personal — subscription anchors on `user_id`.** No organizations table. Accepted risk: team plans later require a real migration (recorded in ADR, see A8).                                                      |
| D4  | First gated feature | **Watch-room limits**: Free is capped on concurrently active owned rooms and members per room; Pro raises caps; Max is uncapped. Enforced in Postgres (RLS/RPC), not UI.                                           |

---

## Spec (grill-requirements)

### In scope

| ID      | Item                                                                                                                                                                                                                                            | Phase | Type        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------- |
| **S1**  | Error tracking: `@sentry/nextjs` wired for Server Actions, route handlers, and client; replace silent `console.error` swallowing in `features/*/actions.ts`/`queries.ts` with captured + user-safe errors                                       | 0     | Foundation  |
| **S2**  | Stop leaking raw Postgres/`error.message` to clients: shared `ActionResult` helper (`apps/web/src/shared/lib/action-result.ts`) that logs the real error and returns a generic/localized message                                                | 0     | Hardening   |
| **S3**  | Rate limiting: `@upstash/ratelimit` + Upstash Redis, applied to `/api/watch/[roomId]/join`, all mutating Server Actions (helper wrapper), and later the billing webhook + checkout                                                              | 0     | Foundation  |
| **S4**  | Activate `audit_events`: server-only `recordAuditEvent()` helper (service-role write) + calls from profile update, room create/host-transfer, and every billing state change                                                                    | 0     | Foundation  |
| **S5**  | Billing schema migration(s) (`022+`): `billing_customers`, `subscriptions`, `webhook_events`, `plans` (tier limits reference table) with RLS + grants in the house style (revoke-all, explicit grants, `private.*` helpers)                     | 1     | Schema      |
| **S6**  | Polar integration: `@polar-sh/sdk` server-only client in `packages/supabase`-style isolation (`apps/web/src/features/billing/polar.ts` or `packages/billing`), env vars validated in `@pumni/env` server schema                                 | 1     | Integration |
| **S7**  | Webhook route `POST /api/webhooks/polar`: raw-body signature verification, idempotent ingest into `webhook_events` (unique `provider_event_id`), subscription upsert via service-role, `updateTag('entitlements:{userId}')`, audit event        | 1     | Integration |
| **S8**  | Checkout + portal Server Actions in `features/billing/actions.ts`: `startCheckout(tier, interval)` and `openCustomerPortal()` — Zod-validated (`@pumni/validators`), `requireUser()`-derived identity, redirect to Polar                        | 1     | Feature     |
| **S9**  | Entitlement read layer: `features/billing/queries.ts` `getEntitlements(userId)` with `'use cache'`, `cacheTag('entitlements:{userId}')`, `cacheLife('minutes')`; single source consumed by UI and server code                                   | 2     | Feature     |
| **S10** | Postgres enforcement: `private.current_tier(uuid)` + `private.room_quota(uuid)` reading `plans`; `watch_rooms` INSERT policy (or hardened RPC) rejects rooms beyond the active-room cap; member cap enforced in `ensureRoomMembership` path/RPC | 2     | Security    |
| **S11** | UI gating + upgrade surface: pricing page, tier badge, "limit reached → upgrade" states; UI gating is cosmetic only (RLS is the boundary)                                                                                                       | 2     | Feature     |
| **S12** | Background jobs (Inngest): webhook retry-safe processing, nightly Polar↔DB subscription reconciliation (safety net under webhooks), stale-room cleanup                                                                                          | 3     | Ops         |
| **S13** | Transactional email (Resend + react-email): payment success/receipt pointer, payment failed (dunning), subscription canceled/expiring                                                                                                           | 3     | Ops         |
| **S14** | Product analytics (PostHog): free→paid funnel events (`checkout_started`, `checkout_completed`, `limit_hit`, `upgraded`, `churned`)                                                                                                             | 3     | Ops         |
| **S15** | Docs/context updates: domain-language glossary terms, `supabase-security.md` service-role policy addendum, new ADR for D1–D4, MEMORY entry                                                                                                      | 0–3   | Docs        |

### Out of scope (hard fence)

| Do not                                                    | Why                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Organizations / team plans / seats                        | D3: personal tenancy; revisit via ADR when demanded                        |
| PayOS / VNPay / any second provider                       | Schema is ready (`provider` column) but no code path until Polar is proven |
| Usage-based / metered billing                             | Tier + quota only; metering is a different architecture                    |
| Stripe direct integration                                 | VN merchant unsupported; Polar is the MoR                                  |
| ORM adoption (Drizzle/Prisma), tRPC, separate API service | Existing supabase-js + Server Actions architecture is the standard here    |
| Mirroring subscription state into Zustand                 | Server state stays in Server Components / Query cache (P2 convention)      |
| Client-side entitlement trust                             | UI checks are cosmetic; Postgres decides (P0)                              |
| Refunds/credit-notes UI, invoicing UI                     | Polar customer portal owns these                                           |
| Trials, coupons, referral codes                           | Post-launch; schema tolerates via subscription `status`/metadata           |
| Touching watch sync-machine internals                     | Gating happens at room create/join boundary, not playback                  |

### Explicit assumptions (confirm or override before the phase that uses them)

| #   | Assumption                                                                   | Default                                                                                                                                            |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Tier quotas (product numbers, editable in `plans` table without code change) | free: **1 active owned room / 5 members**; pro: **10 / 20**; max: **unlimited (`null`)**                                                           |
| A2  | Pricing (set in Polar dashboard, not in code)                                | pro ~$5/mo, max ~$12/mo; yearly ≈ 2 months free — placeholder, product decision                                                                    |
| A3  | "Active room" definition                                                     | room whose `last_active_at` is within 24h **or** has members; enforcement counts owned rooms matching this                                         |
| A4  | Downgrade behavior when over quota                                           | existing rooms are **not deleted**; creating new rooms is blocked until under cap                                                                  |
| A5  | Rate-limit backend                                                           | Upstash Redis (free tier). If no new external service is wanted, fall back to a Postgres token-bucket in `private.*` — slower but zero new vendors |
| A6  | Jobs runtime                                                                 | Inngest (serverless-friendly). Minimal alternative: `pg_cron` + Supabase queues for reconciliation only                                            |
| A7  | Emails sent from                                                             | Resend with a project domain; until domain exists, Polar's own receipt emails suffice (S13 can defer)                                              |
| A8  | ADR required                                                                 | One ADR covering D1–D4 (irreversible: provider + tenancy anchor). Cosmetic quota numbers need no ADR                                               |
| A9  | Environments                                                                 | Polar sandbox in dev; live token only in production env vars. Webhook secret differs per env                                                       |
| A10 | No commits/pushes without explicit ask; one PR per phase                     | Yes                                                                                                                                                |

### Acceptance criteria (falsifiable)

1. **A Server Action failure never returns a raw driver message**: unit test
   asserts `updateProfile` (and billing actions) return the generic message
   while Sentry capture (mock) received the original error.
2. **Rate limit**: >N requests/min to `/api/watch/[roomId]/join` from one
   user/IP returns 429 (test with mocked limiter); billing webhook and checkout
   share the wrapper.
3. **Webhook idempotency**: delivering the same Polar event payload twice
   results in exactly one `webhook_events` row and one subscription state
   transition (unique-violation path covered by test).
4. **Signature verification**: a webhook request with an invalid signature is
   rejected 401 **before** any DB write.
5. **Entitlement chain**: given a `subscriptions` row flipping
   `free → pro (active)`, `getEntitlements` (after `updateTag`) reflects
   `tier: 'pro'` without redeploy; RLS test proves a free user's **(cap+1)-th**
   active room INSERT is rejected by Postgres (not by UI), and a pro user's
   succeeds.
6. **Member cap**: joining a full free-tier room fails at the RPC/policy with
   the localized message; joining under cap succeeds.
7. **Cross-user isolation**: user A can never select user B's
   `billing_customers` / `subscriptions` rows (RLS test); only `service_role`
   can write billing tables — `authenticated` has no INSERT/UPDATE grants.
8. **Audit trail**: every billing state change and room host transfer produces
   an `audit_events` row (asserted in action/webhook tests).
9. **Secrets**: `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` /
   `UPSTASH_*` exist only in `serverEnvSchema`; `ai:check` + grep gate proves
   no `NEXT_PUBLIC_` leakage and all billing modules carry `server-only`.
10. **Reconciliation**: the nightly job, run against a fixture drift (DB says
    active, Polar says canceled), converges DB to Polar and emits an audit
    event.

### Verification gate (narrowest → widest)

| Scope                                               | Command                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| One feature slice (billing actions/queries/webhook) | `bun run --filter web test -- billing` (vitest path filter)                                                                                    |
| Migrations / RLS                                    | `supabase-rls-reviewer` subagent on the diff + RLS unit tests (pgTAP-style SQL or service/anon-key integration tests if local stack available) |
| Web app                                             | `bun run --filter web lint typecheck test`                                                                                                     |
| Context/docs edits                                  | `bun run ai:check`                                                                                                                             |
| Pre-merge (authoritative)                           | `bun run ai:premerge`                                                                                                                          |

---

## Architecture

### New/changed modules

```
apps/web/src/features/billing/     ← new vertical slice (feature-module skill)
  actions.ts        startCheckout, openCustomerPortal  ('use server')
  queries.ts        getEntitlements, getSubscription   ('server-only', use cache)
  polar.ts          server-only Polar SDK client factory
  components/       pricing table, tier badge, upgrade dialog
  types.ts          Tier, Entitlements, quota types
apps/web/src/app/api/webhooks/polar/route.ts   ← webhook (route handler, NOT action)
apps/web/src/app/(app)/pricing|billing/…       ← pricing + manage pages
apps/web/src/shared/lib/action-result.ts       ← S2 shared failure helper
apps/web/src/shared/lib/rate-limit.ts          ← S3 limiter wrapper ('server-only')
apps/web/src/shared/lib/audit.ts               ← S4 recordAuditEvent ('server-only')
packages/validators/src/billing.ts             ← checkoutSchema (tier, interval)
packages/env/src/server-schema.ts              ← + POLAR_*, UPSTASH_*, SENTRY_*, RESEND_* (optional-guarded like SUPABASE_SERVICE_ROLE_KEY)
supabase/migrations/022_billing_core.sql       ← S5 (may split 022/023)
supabase/migrations/02x_watch_room_quotas.sql  ← S10
```

Catalog additions (root `package.json`, via `dependency-update` flow):
`@polar-sh/sdk`, `@upstash/ratelimit`, `@upstash/redis`, `@sentry/nextjs`,
`inngest` (phase 3), `resend` + `@react-email/components` (phase 3),
`posthog-js`/`posthog-node` (phase 3).

### Schema design (S5)

All tables: `enable row level security`, `revoke all … from anon, authenticated`,
explicit minimal grants, service_role full — same shape as migration 001/018.

| Table               | Key columns                                                                                                                                                                                                                                  | RLS                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `plans`             | `tier text pk ('free','pro','max')`, `max_active_rooms int null`, `max_room_members int null`, `updated_at`                                                                                                                                  | SELECT for `authenticated` (public reference data); writes service_role only. Seeded in-migration with A1 defaults |
| `billing_customers` | `user_id uuid pk → auth.users`, `provider text not null default 'polar'`, `provider_customer_id text`, unique `(provider, provider_customer_id)`                                                                                             | SELECT own (`auth.uid() = user_id`); **no** INSERT/UPDATE grants to `authenticated` (service_role writes only)     |
| `subscriptions`     | `id uuid pk`, `user_id`, `provider`, `provider_subscription_id unique`, `tier text references plans`, `status text` (`active/trialing/past_due/canceled/revoked`), `current_period_end timestamptz`, `cancel_at_period_end bool`, timestamps | SELECT own; writes service_role only                                                                               |
| `webhook_events`    | `id uuid pk`, `provider`, `provider_event_id text`, unique `(provider, provider_event_id)`, `event_type`, `payload jsonb`, `received_at`, `processed_at`, `error text`                                                                       | **No** grants to `authenticated` at all; service_role only                                                         |

Functions (house style: `private.*` security definer with pinned
`search_path`, thin `public.*` invoker wrappers only where PostgREST needs
them):

- `private.current_tier(p_user uuid) returns text` — highest tier among the
  user's subscriptions with `status in ('active','trialing')` and
  `current_period_end > now()`, else `'free'`. `stable`.
- `private.can_create_room(p_user uuid) returns boolean` — counts active owned
  rooms (A3) vs `plans.max_active_rooms` for `current_tier`.
- `private.can_join_room(p_room uuid) returns boolean` — member count vs the
  **host's** tier cap (rooms inherit the host's plan).
- `watch_rooms` INSERT policy gains `and private.can_create_room((select auth.uid()))`;
  membership insert path (RPC `ensure_room_membership`/policy) gains
  `private.can_join_room(room_id)` with the localized Vietnamese error.

### Webhook flow (S7) — the invariant list

1. Read **raw body**; verify Polar signature with `POLAR_WEBHOOK_SECRET`; 401 on failure (no DB touch).
2. `insert … on conflict (provider, provider_event_id) do nothing` into `webhook_events`; if no row inserted → already processed → 200 immediately (idempotency).
3. Switch on event type (`subscription.created|updated|canceled|revoked`, `order.*`): upsert `billing_customers` + `subscriptions` by provider ids (service-role client).
4. `updateTag('entitlements:{userId}')` — note: `updateTag` is Server-Action-only in Next 16; from a route handler use `revalidateTag('entitlements:{userId}', 'max')` (two-arg form per `.claude/rules/nextjs-cache-components.md`).
5. `recordAuditEvent(...)`, mark `processed_at`; on handler error record `error` and return 500 so Polar retries (retry is safe because of step 2 + upserts).
6. Never trust redirect/success URLs for fulfillment — webhook is the only writer of subscription state.

### Entitlement read (S9)

`getEntitlements(userId)` mirrors `getProfileByUserId`: `'use cache'`,
`cacheTag('entitlements:{userId}')`, `cacheLife('minutes')`, service-role read
of `subscriptions` + `plans`, returns
`{ tier, maxActiveRooms, maxRoomMembers }`. This is the **only** module UI and
server code import for gating; Postgres re-checks independently (defense in
depth, same doctrine as `assertHostOwnership`).

---

## Phased execution

Each step is a vertical slice: migration/code + test + gate green before the
next. One PR per phase (A10).

### Phase 0 — Foundations before money (S1–S4)

| Step | Slice                                                                                                                              | Skill route                                    | Gate                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------- |
| 0.1  | `action-result.ts` helper + refactor `updateProfile` and watch actions off raw `error.message`; unit tests                         | `codebase-design` + `testing-template`         | web test                   |
| 0.2  | `@sentry/nextjs` install + instrumentation; capture in the S2 helper                                                               | `dependency-update`                            | build + manual event check |
| 0.3  | `rate-limit.ts` wrapper + apply to join route; env vars in server schema; 429 test with injected limiter                           | `server-action` (pattern) + `testing-template` | web test                   |
| 0.4  | `audit.ts` (`recordAuditEvent`, service-role, fire-and-forget with capture) + wire into profile update, room create, host transfer | `server-action`                                | web test                   |
| 0.5  | ADR for D1–D4; domain-language additions                                                                                           | `domain-modeling`                              | `ai:check`                 |

### Phase 1 — Billing core (S5–S8)

| Step | Slice                                                                                                                                               | Skill route                       | Gate                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------- |
| 1.1  | Migration `022_billing_core.sql` (tables, RLS, grants, `private.current_tier`, seeds). **Ask-first: schema change**                                 | `supabase-migration`              | `supabase-rls-reviewer` + RLS tests |
| 1.2  | Env schema + Polar server-only client + Polar sandbox products (free/pro/max × mo/yr)                                                               | manual + `zod-validator` (env)    | typecheck + `ai:check`              |
| 1.3  | Webhook route with the S7 invariant list; idempotency + signature tests (fixture payloads, mocked SDK verify)                                       | `testing-template`                | web test                            |
| 1.4  | `checkoutSchema` in validators; `startCheckout` / `openCustomerPortal` actions (requireUser → customer upsert → session URL redirect); rate-limited | `zod-validator` + `server-action` | web test                            |
| 1.5  | Sandbox end-to-end: checkout → webhook → `subscriptions` row → audit event (manual + recorded in PR)                                                | `verify`                          | manual E2E                          |

### Phase 2 — Entitlements & first paid feature (S9–S11)

| Step | Slice                                                                                                                     | Skill route                     | Gate                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------- |
| 2.1  | `getEntitlements` cached query + `entitlements:{userId}` tag; webhook revalidates it                                      | `server-component-read`         | web test                      |
| 2.2  | Migration `02x_watch_room_quotas.sql`: `can_create_room` / `can_join_room` + policy changes. **Ask-first: schema change** | `supabase-migration`            | RLS tests: criteria 5–6       |
| 2.3  | Surface quota failures in `createRoom` / `ensureRoomMembership` with localized messages (existing `ActionResult` shape)   | `server-action`                 | web test                      |
| 2.4  | Pricing page + tier badge + limit-reached upgrade prompts (cosmetic gating only)                                          | `feature-module` + `ui-styling` | lint/typecheck/test + `ai:tw` |
| 2.5  | Launch checklist: Polar live products, prod env vars, webhook endpoint registered                                         | —                               | manual                        |

### Phase 3 — SaaS operations (S12–S14)

| Step | Slice                                                                                                                                      | Skill route                     | Gate                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------- |
| 3.1  | Inngest setup; move webhook step-3 processing into a durable function (route stays thin ingest); nightly reconciliation job (criterion 10) | `feature-module` (billing/jobs) | web test + job dry-run |
| 3.2  | Resend + react-email templates (payment failed, canceled, expiring); triggered from job/webhook — defer if A7 domain not ready             | `testing-template`              | web test               |
| 3.3  | PostHog events at checkout/limit/upgrade points; funnel dashboard                                                                          | —                               | manual                 |
| 3.4  | Docs sweep: `supabase-security.md` billing addendum, golden example (webhook), MEMORY entry                                                | `domain-modeling`               | `ai:check` + `ai:eval` |

---

## Blast radius

| Area                                                              | Touched                                                                 | Risk                                                                                                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations`                                             | +2–3 migrations; **`watch_rooms`/`room_members` policies change** (2.2) | Highest — a wrong quota policy locks users out of existing rooms. Mitigate: A4 (never delete/block existing rooms), RLS tests before merge, reviewer subagent |
| `apps/web/src/features/watch`                                     | `actions.ts` error surfaces only; sync-machine untouched                | Low                                                                                                                                                           |
| `apps/web/src/features/profile`                                   | 0.1 refactor of return messages                                         | Low                                                                                                                                                           |
| `packages/env`                                                    | server schema additions                                                 | Low (validated at boot)                                                                                                                                       |
| `packages/validators`                                             | +billing schemas                                                        | Low                                                                                                                                                           |
| New: `features/billing`, `api/webhooks/polar`, shared lib helpers | Additive                                                                | Medium (webhook correctness carries the money)                                                                                                                |

## Risks & mitigations

| Risk                                                          | Mitigation                                                                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook and checkout race (user returns before webhook lands) | Success page reads `getEntitlements` with a short client poll/refresh; never fulfills from the redirect itself                            |
| Polar outage / missed webhooks                                | 3.1 nightly reconciliation converges DB to Polar; `webhook_events.error` rows are alertable via Sentry                                    |
| Service-role sprawl (more bypass-RLS code)                    | All billing writes concentrated in webhook handler + `audit.ts`; `supabase-security.md` addendum makes this the documented exception list |
| Quota check performance on room create                        | `current_tier`/counts are single-index lookups; functions `stable`; acceptable at current scale — no premature caching in Postgres        |
| Tier/product drift between Polar dashboard and `plans` table  | Product ids ↔ tier mapping lives in one server module (`polar.ts`); reconciliation job flags unknown product ids                          |
| `updateTag` misuse from route handler (runtime throw)         | S7 invariant explicitly uses two-arg `revalidateTag` in the webhook; rule file already covers this                                        |

## Domain language additions (via `domain-modeling`, step 0.5)

**Tier** (free/pro/max plan level), **Entitlement** (the resolved capability +
quota set a user holds, derived from subscription state, cached under
`entitlements:{userId}`), **Billing customer** (the user↔provider identity
link), **Webhook event** (idempotent provider notification, unique per
`provider_event_id`), **Quota** (a numeric cap from `plans`, enforced in
Postgres), **Reconciliation** (periodic provider↔DB convergence job).

## Done (per repo definition)

Each phase: narrowest gate green per slice (bug-style slices start red),
no unrelated code changed, owning docs updated (S15), and finally
`bun run ai:check` + `bun run ai:eval` + `bun run ai:premerge` green before the
phase PR is opened.
