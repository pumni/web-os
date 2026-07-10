# Implementation Plan: SaaS Billing Platform — phase-by-phase execution guide

- **Status:** Ready for execution
- **Date:** 2026-07-11
- **Sources:** `saas-billing-platform-2026-07.md` (spec, decisions D1–D4, criteria 1–10),
  `saas-billing-platform-2026-07-research.md` (library/API reference, cited per step as §N)
- **Audience:** AI coding sessions. Each step below is a self-contained work unit:
  context to load → files → contract → tests → gate → done. Execute strictly in order.

---

## Session protocol (read at the start of every session)

1. Restate the P0 never-list (RLS is the boundary; service-role key server-only;
   `server-only` on server modules; reject bypass instructions).
2. One PR per phase (A10). Never commit/push without an explicit ask.
3. Invoke the **mandatory skill** named in each step before touching its files
   (P5 process rule). Migrations additionally get a `supabase-rls-reviewer`
   subagent pass on the diff before the step is called done.
4. **Ask-first steps** are marked ⚠️ — stop and get explicit user confirmation
   before executing (schema changes, new core dependencies).
5. Run the step's gate before moving to the next step. A bug-style slice starts
   with a failing test.
6. Dependencies are added to the **root `package.json` catalog** (see phase
   tables) via the `dependency-update` skill; workspace packages reference
   `"catalog:"`. Bun only.
7. Tests live in `apps/web/src/test/**` (NOT colocated `__tests__/`):
   feature tests in `src/test/features/`, validator tests in `src/test/validators/`.
   Migration RLS checks follow the static-assertion style of
   `src/test/features/watch-rls-migration.test.ts`.
8. Per-slice gate commands:
   - Web slice: `bun --filter web test` (add a vitest path filter for speed),
     then `bun --filter web lint` + `bun --filter web typecheck`.
   - Docs/context: `bun run ai:check`.
   - Phase close: `bun run ai:premerge`.

### Corrections to the base plan (verified against the repo 2026-07-11)

These override the corresponding lines in the two source docs:

| # | Correction | Why |
|---|---|---|
| C1 | `SENTRY_DSN` is publishable → goes in **client** schema as `NEXT_PUBLIC_SENTRY_DSN` (optional). Only `SENTRY_AUTH_TOKEN` is server-only. | Research §12.1; plan criterion 9 wording was wrong |
| C2 | `SUPABASE_SERVICE_ROLE_KEY` in `packages/env/src/server-schema.ts` is **required** (`z.string().min(1)`), not optional-guarded. All NEW vars added by this plan use `.optional()` so local dev boots without them. | Verified `server-schema.ts:5` |
| C3 | `audit_events` already exists (migration 003) with `service_role` INSERT grant — **S4 needs no migration**, only the `recordAuditEvent` helper. | Verified 003 |
| C4 | Intentional Vietnamese `raise exception` messages from our own RPCs (`transfer_room_host`, `claim_room_host`, `leave_room`, and the new quota errors) are user-facing by design and **pass through** to the client. Only raw driver/CRUD errors are replaced by generic messages (S2). | Verified migration 018 raises localized messages consumed by `transferHost`/`claimHost` |
| C5 | Next migration numbers: `022_billing_core.sql`, `023_watch_room_quotas.sql`. Next ADR number: **0028**. | Verified migrations 001–021, ADRs up to 0027 |
| C6 | The single source of truth for tier resolution is **SQL** (`private.current_tier`). `getEntitlements` calls a service-role-only RPC wrapper instead of re-implementing ranking in TS (prevents the tier-drift risk the plan itself flags). | See step 1.1 / 2.1 |
| C7 | `createRoom` inserts the room **and then** the host's own `room_members` row (`actions.ts:173`) — the new `can_join_room` policy must let the host's self-insert pass (count 0 < any cap). | Verified `watch/actions.ts` |
| C8 | Policy rejections surface to supabase-js as error code **42501** with generic Postgres text — step 2.3 maps 42501 on the two gated paths to localized upgrade messages. | Postgres behavior; `ensureRoomMembership` currently only tolerates 23505 |

---

## Phase 0 — Foundations before money (PR #1, S1–S4 + ADR)

**Catalog additions:** `@sentry/nextjs`, `@upstash/ratelimit`, `@upstash/redis`.

### Step 0.1 — Shared `ActionResult` + generic failure helper (S2)

- **Skills:** `codebase-design`, `testing-template`
- **Read first:** `apps/web/src/features/watch/action-helpers.ts` (existing shape), research §2.7

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/shared/lib/action-result.ts` |
| Edit | `apps/web/src/features/watch/action-helpers.ts` (re-export the shared type; delete local def) |
| Edit | `apps/web/src/features/watch/actions.ts`, `apps/web/src/features/profile/actions.ts` |
| Create | `apps/web/src/test/features/action-result.test.ts`, extend profile action tests |

**Contract** (`action-result.ts`, top line `import 'server-only';`)

```ts
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

/** Log/capture the real error, return a generic localized message to the client. */
export function actionFailure(error: unknown, publicMessage: string): { ok: false; message: string };

/** Zod safeParse → typed data or ready-to-return failure (promoted from watch/actions.ts). */
export function parseActionInput<T>(schema, input, errorMessage): { ok: true; data: T } | { ok: false; message: string };
```

`actionFailure` calls `console.error` now; step 0.2 swaps in `Sentry.captureException`.

**Refactor rules**

- Every `return { ok: false, message: error.message }` where `error` comes from
  a `.from(...)` CRUD call → `return actionFailure(error, '<localized generic>')`.
  Sites: `profile/actions.ts:36`; `watch/actions.ts` in `createRoom`, `setRoomSource`,
  `joinByCode`, `addQueueItem` (×2), `reorderQueue`, `advanceQueue`, and the
  `startPlayingItem` error propagation.
- Per C4: `transferHost`, `claimHost`, `leaveRoom` RPC errors keep passing
  `error.message` through (they are our localized `raise exception` texts).
- Do NOT change the discriminated shape — client components already consume it.

**Tests:** mocked supabase client throws/errors → action returns the generic
message; the capture hook (spy) received the original error (criterion 1).

**Gate:** `bun --filter web test` + `bun --filter web typecheck`.

### Step 0.2 — Sentry (S1)

- **Skills:** `dependency-update`
- **Read first:** research §2 (three runtime configs, `onRequestError`, `withSentryConfig`)

**Files**

| Action | File |
|---|---|
| Create | `apps/web/instrumentation.ts` (register + `export const onRequestError = Sentry.captureRequestError`) |
| Create | `apps/web/instrumentation-client.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts` |
| Create | `apps/web/src/app/global-error.tsx` |
| Edit | `apps/web/next.config.ts` → wrap with `withSentryConfig` (`tunnelRoute`, `silent: !process.env.CI`) |
| Edit | `packages/env/src/client-schema.ts` → `NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional()` (C1) |
| Edit | `packages/env/src/server-schema.ts` → `SENTRY_AUTH_TOKEN: z.string().min(1).optional()` |
| Edit | `apps/web/src/shared/lib/action-result.ts` → `Sentry.captureException(error)` inside `actionFailure` |

**Rules:** init must be no-op when DSN is absent (local dev). Per research §2.7 do
NOT put `withServerActionInstrumentation` inside the shared helper — it needs the
action name; add it per-action only where tracing is wanted (billing actions in 1.4).

**Gate:** `bun run build` (web) + one manual captured event in dev; `bun run ai:check`
(env docs in `packages/env/AGENTS.md` unchanged behavior → no doc edit needed).

### Step 0.3 — Rate limiting (S3)

- **Skills:** `testing-template` (pattern per `server-action`)
- **Read first:** research §3 (sliding window, `pending`, fail-open guidance)

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/shared/lib/rate-limit.ts` (`import 'server-only'`) |
| Edit | `apps/web/src/app/api/watch/[roomId]/join/route.ts` |
| Edit | `packages/env/src/server-schema.ts` → `UPSTASH_REDIS_REST_URL: z.url().optional()`, `UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional()` |
| Create | `apps/web/src/test/features/rate-limit.test.ts` |

**Contract**

```ts
export type Limiter = { limit(key: string): Promise<{ success: boolean; reset: number }> };
// Default limiter: Ratelimit.slidingWindow(N, '1 m'), prefix 'pumni:ratelimit'.
// Missing UPSTASH_* env → no-op limiter (always success) + one-time warn (dev fail-open).
export function getLimiter(): Limiter;                    // module-level singleton, injectable for tests
export async function withRateLimit<T>(key: string, fn: () => Promise<T>): Promise<T | { ok: false; message: string }>; // 'Vượt quá giới hạn thao tác, vui lòng thử lại sau.'
export async function limitOr429(key: string): Promise<Response | null>;  // for route handlers, Retry-After header
```

- Join route: key `join:${userId}:${roomId}` (derive user via `requireUser()`), 429 on exceed.
- Keep the wrapper **opt-in per action** — apply to `createRoom` and `updateProfile`
  now; billing actions get it in 1.4. Webhook limits (if any) must allow ≥10 rps
  (Polar retry storms, research §3.7).

**Tests:** injected fake limiter returning `success: false` → route returns 429
with `Retry-After`; action wrapper returns the localized 429 message (criterion 2).

**Gate:** `bun --filter web test`.

### Step 0.4 — Audit helper (S4)

- **Skills:** `server-action`
- **Read first:** migration `003_audit_events.sql` (C3 — no migration needed)

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/shared/lib/audit.ts` (`import 'server-only'`) |
| Edit | `apps/web/src/features/profile/actions.ts` (`profile.updated`), `apps/web/src/features/watch/actions.ts` (`watch_room.created`, `watch_room.host_transferred`) |
| Create | `apps/web/src/test/features/audit.test.ts` |

**Contract**

```ts
export type AuditEvent = {
  actorId: string | null;          // null for system/webhook events
  action: string;                  // '<entity>.<verb>' e.g. 'subscription.activated'
  entityType: string;              // 'profile' | 'watch_room' | 'subscription' | ...
  entityId?: string;
  metadata?: Record<string, unknown>;
};
/** Service-role insert. Fire-and-forget: never throws; failures go to Sentry. */
export async function recordAuditEvent(event: AuditEvent): Promise<void>;
```

Uses `createSupabaseServiceRoleClient()` — document why in a code comment
constraint: audit rows must persist even when the acting context is a webhook
with no authenticated session.

**Tests:** each wired action asserts one insert with expected `action`/`entity_type`
(criterion 8, partial); helper swallows insert failure and captures it.

**Gate:** `bun --filter web test`.

### Step 0.5 — ADR 0028 + domain language + memory (S15)

- **Skills:** `domain-modeling`

**Files:** `docs/adr/0028-polar-billing-personal-tenancy.md` (covers D1–D4, A8),
`docs/ai/domain-language.md` (+ Tier, Entitlement, Billing Customer, Webhook
Event, Quota, Reconciliation — definitions in plan §Domain language),
`docs/ai/MEMORY.md` (settled decisions), then `bun run ai:adr:sync`.

**Gate:** `bun run ai:check` + `bun run ai:eval`.

**Phase 0 close:** `bun run ai:premerge` green → open PR #1.

---

## Phase 1 — Billing core (PR #2, S5–S8)

**Catalog additions:** `@polar-sh/sdk` (no `@polar-sh/nextjs` — research §1.10/§10.4).

### Step 1.1 ⚠️ — Migration `022_billing_core.sql` (S5) — ask-first: schema change

- **Skills:** `supabase-migration` (mandatory); gate includes `supabase-rls-reviewer` subagent
- **Read first:** `docs/conventions/supabase-security.md`, migration 018 (house style), research §8–§9

**One migration file containing, in order:**

1. **Tables** (all: `enable row level security` → policies `to authenticated`
   with `(select auth.uid())` → `revoke all from anon, authenticated` → explicit
   minimal grants → full grants to `service_role`):
   - `plans(tier text pk check (tier in ('free','pro','max')), max_active_rooms int, max_room_members int, updated_at timestamptz not null default now())`
     — SELECT for `authenticated` (`using (true)`); writes service_role only.
     Seed per A1: `('free',1,5), ('pro',10,20), ('max',null,null)` (null = unlimited).
   - `billing_customers(user_id uuid pk references auth.users(id) on delete cascade, provider text not null default 'polar', provider_customer_id text, email text, created_at, updated_at)`
     + `unique (provider, provider_customer_id)` — SELECT own only; **no**
     INSERT/UPDATE/DELETE grants to `authenticated`.
   - `subscriptions(id uuid pk default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, provider text not null default 'polar', provider_subscription_id text not null, tier text not null references public.plans(tier), status text not null check (status in ('incomplete','trialing','active','past_due','canceled','revoked')), current_period_end timestamptz, cancel_at_period_end boolean not null default false, metadata jsonb not null default '{}'::jsonb, created_at, updated_at)`
     + `unique (provider, provider_subscription_id)` — SELECT own only; writes service_role only.
   - `webhook_events(id uuid pk default gen_random_uuid(), provider text not null, provider_event_id text not null, event_type text not null, payload jsonb not null, received_at timestamptz not null default now(), processed_at timestamptz, error text)`
     + `unique (provider, provider_event_id)` (the idempotency constraint) —
     **zero** grants to `anon`/`authenticated`; service_role only. RLS enabled with no policies.
2. **Indexes** (research §8.7): `subscriptions(user_id)`, `subscriptions(user_id, status, current_period_end)`, `billing_customers(provider, provider_customer_id)` (the unique constraints already index the provider-id pairs).
3. **Functions** (house style: `private.*` security definer, `set search_path = public, private`, `stable`; revoke-then-grant execute):
   - `private.current_tier(p_user uuid) returns text` — highest tier among
     subscriptions with `status in ('active','trialing','past_due')` and
     `current_period_end > now()`, ranked max>pro>free, else `'free'`
     (`past_due` inside period = grace, research §8.5/§9.1). Grant execute to `authenticated` (used by RLS policies in 023).
   - `private.get_entitlements(p_user uuid) returns table (tier text, max_active_rooms int, max_room_members int)` —
     joins `current_tier` → `plans` (C6). Public wrapper
     `public.get_user_entitlements(p_user uuid)` security **definer** too, but
     execute granted to **service_role only** (it takes an arbitrary user id —
     must never be callable by `authenticated`).

**Tests:** `apps/web/src/test/features/billing-rls-migration.test.ts` — static
SQL assertions in the `watch-rls-migration.test.ts` style: RLS enabled on all 4
tables, no authenticated write grants, webhook_events has no authenticated
grants at all, unique constraints present, seed rows present, function grants
correct (criterion 7 static half). If a local Supabase stack is available, add
the two-client isolation test (user A cannot read B's rows).

**Gate:** `supabase-rls-reviewer` on the diff + migration test green.
Regenerate types if the repo flow does so (`packages/supabase/src/types.ts` is
generated — never hand-edit).

### Step 1.2 — Env + Polar server-only client (S6)

- **Skills:** `zod-validator` (env), `dependency-update`
- **Read first:** research §1.1, §1.9, §10.1–§10.3

**Files**

| Action | File |
|---|---|
| Edit | `packages/env/src/server-schema.ts` → `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` (`z.string().min(1).optional()` per C2), `POLAR_SERVER: z.enum(['sandbox','production']).default('sandbox')`, `POLAR_PRODUCT_PRO_MONTHLY/PRO_YEARLY/MAX_MONTHLY/MAX_YEARLY: z.string().min(1).optional()` |
| Create | `apps/web/src/features/billing/polar.ts` (`import 'server-only'`) |
| Create | `apps/web/src/features/billing/types.ts` (`Tier = 'free'|'pro'|'max'`, `Interval = 'monthly'|'yearly'`, `Entitlements`) |
| Create | `apps/web/src/features/billing/index.ts` (public API barrel, feature-module convention) |

**Contract** (`polar.ts`)

```ts
export function getPolarClient(): Polar;                          // throws if POLAR_ACCESS_TOKEN missing; server: serverEnv.POLAR_SERVER
export function productIdFor(tier: 'pro'|'max', interval: Interval): string;  // env-backed map; throws on unset
export function tierForProductId(productId: string): Tier | null; // reverse lookup; null = unknown → reconciliation flags it
```

Product ids live ONLY here (plan risk: tier/product drift). No product ids in
client code, ever. Manual side-task: create the 4 sandbox products in the Polar
dashboard and record their ids in `.env.local` (values never committed).

**Gate:** `bun --filter web typecheck` + `bun run ai:check`.

### Step 1.3 — Webhook route (S7)

- **Skills:** `testing-template`
- **Read first:** research §1.2, §1.4–§1.5, §10.5 (the 8-item invariant list), §7.5
  (`revalidateTag` two-arg), `docs/conventions/nextjs-16.md`

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/app/api/webhooks/polar/route.ts` |
| Create | `apps/web/src/features/billing/webhook-handlers.ts` (`import 'server-only'` — pure-ish, unit-testable event→upsert logic) |
| Create | `apps/web/src/test/features/billing-webhook.test.ts` |

**Route invariants (must all hold — copy of research §10.5):**

1. `const body = await request.text()` — raw body FIRST, never `request.json()` before verification.
2. `validateEvent(body, headers, serverEnv.POLAR_WEBHOOK_SECRET)` from
   `@polar-sh/sdk/webhooks`; `WebhookVerificationError` → **401, zero DB writes** (criterion 4).
3. Service-role `insert into webhook_events … on conflict do nothing` +
   `.select('id').maybeSingle()`; no row returned → already processed → **200** immediately (criterion 3).
4. Dispatch by `event.type` in `webhook-handlers.ts`:
   - `subscription.created|active|updated|uncanceled` → upsert `subscriptions`
     by `(provider, provider_subscription_id)`; resolve `user_id` from
     `customer.external_id` (we always set `externalCustomerId = user.id`, research §1.9);
     map product id → tier via `tierForProductId` (unknown id → record error, 200, alert via Sentry).
   - `subscription.canceled|revoked` → flip `status`, keep row.
   - `customer.created|updated|state_changed` → upsert `billing_customers`.
   - `order.paid` → audit event only. Unknown types → mark processed, 200.
5. Per affected user: `revalidateTag(\`entitlements:${userId}\`, { expire: 0 })`
   — two-arg form, `updateTag` is illegal here (Route Handler).
6. `recordAuditEvent({ actorId: null, action: 'subscription.<verb>', entityType: 'subscription', … })`.
7. Set `webhook_events.processed_at = now()`.
8. Any handler error → set `webhook_events.error`, return **500** (Polar retries; safe by #3).
   Respond fast: no slow calls in the route (Polar 10s timeout / 2s target, research §1.5).

**Tests (fixture payloads, mocked `validateEvent` + mocked service-role client):**
invalid signature → 401 and no insert call; duplicate `provider_event_id` →
single insert, no second upsert; `subscription.active` → subscriptions upsert +
`revalidateTag` spy called with two args + audit insert; handler error → error
recorded + 500 (criteria 3, 4, 8).

**Gate:** `bun --filter web test`.

### Step 1.4 — Checkout + portal Server Actions (S8)

- **Skills:** `zod-validator` → `server-action` (both mandatory)
- **Read first:** `docs/conventions/data-fetching.md`, research §1.10 recommendations

**Files**

| Action | File |
|---|---|
| Create | `packages/validators/src/billing.ts` + export from `index.ts` |
| Create | `apps/web/src/features/billing/actions.ts` (`'use server'`) |
| Create | `apps/web/src/test/validators/billing.test.ts`, `apps/web/src/test/features/billing-actions.test.ts` |

**Contract**

```ts
// validators
export const checkoutSchema = z.object({ tier: z.enum(['pro','max']), interval: z.enum(['monthly','yearly']) });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// actions.ts
export async function startCheckout(input: CheckoutInput): Promise<ActionResult<never>>; // redirects on success
export async function openCustomerPortal(): Promise<ActionResult<never>>;                // redirects on success
```

- Both: `requireUser()` → `parseActionInput` → `withRateLimit(\`billing:${user.id}\`, …)`
  → wrap body in `Sentry.withServerActionInstrumentation` (research §2.3).
- `startCheckout`: `polar.checkouts.create({ products: [productIdFor(tier, interval)], externalCustomerId: user.id, customerIpAddress, successUrl })`
  → `redirect(checkout.url)`. `customerIpAddress` from `(await headers()).get('x-forwarded-for')` split (research §1.8) — read headers before any cache scope.
  **`redirect()` throws `NEXT_REDIRECT` — call it OUTSIDE any try/catch**, or rethrow when `isRedirectError`.
- `openCustomerPortal`: look up own `billing_customers.provider_customer_id`
  (user-scoped client — RLS SELECT-own applies); none → localized "chưa có gói
  trả phí" failure. Else `polar.customerSessions.create({ customerId })` → redirect to portal URL.
- Fulfillment NEVER happens here — the webhook is the only writer of
  subscription state (plan risk: checkout/webhook race).

**Tests:** invalid input → localized failure; unauthenticated → `requireUser`
throws; Polar SDK error → generic `actionFailure` message + Sentry spy hit
(criterion 1); rate-limited path returns 429 message.

**Gate:** `bun --filter web test` + `bun --filter web lint typecheck`.

### Step 1.5 — Sandbox end-to-end (manual)

- **Skills:** `verify`
- Local flow: `bun run dev` + Polar sandbox + webhook tunnel (`polar listen` or ngrok, research §1.7).
- Verify: checkout → sandbox payment → webhook 200 → `subscriptions` row with
  right tier/status → `webhook_events.processed_at` set → `audit_events` row.
  Deliver the same event twice (Polar dashboard redelivery) → still one row each.
- Record the run (steps + observed rows) in the PR description.

**Phase 1 close:** `bun run ai:premerge`; update
`docs/conventions/supabase-security.md` (service-role exception addendum: the
webhook handler + `audit.ts` + `getEntitlements` are the documented service-role
writers/readers for billing), `docs/conventions/nextjs-16.md` (route-handler
`revalidateTag` example), `docs/ai/golden-examples.md` (webhook route),
`bun run ai:graph:sync` → open PR #2.

---

## Phase 2 — Entitlements & watch-room gating (PR #3, S9–S11)

### Step 2.1 — `getEntitlements` cached read (S9)

- **Skills:** `server-component-read` (mandatory)
- **Read first:** `apps/web/src/features/profile/queries.ts` (the exact pattern to mirror), research §7

**Files:** create `apps/web/src/features/billing/queries.ts`
(`import 'server-only'`), export via `index.ts`; test
`apps/web/src/test/features/billing-entitlements.test.ts`.

**Contract** (mirrors `getCurrentProfile` → `getProfileByUserId` split — cookies
outside the cache scope, research §7.7):

```ts
export type Entitlements = { tier: Tier; maxActiveRooms: number | null; maxRoomMembers: number | null };

export async function getEntitlements(): Promise<Entitlements> {
  const user = await requireUser();               // outside 'use cache'
  return getEntitlementsForUser(user.id);
}

async function getEntitlementsForUser(userId: string): Promise<Entitlements> {
  'use cache';
  cacheTag(`entitlements:${userId}`);             // parameterized — never bare
  cacheLife('minutes');
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc('get_user_entitlements', { p_user: userId }); // C6: SQL is the SSOT
  // error → throw; empty → free-tier defaults from plans
}
```

**Tests:** RPC mocked per tier → shape correct; RPC error → throws; free default
when no subscription. Tier-flip freshness (criterion 5, cache half) is covered
by the 1.3 webhook test (`revalidateTag` spy) + 1.5-style manual check.

**Gate:** `bun --filter web test`.

### Step 2.2 ⚠️ — Migration `023_watch_room_quotas.sql` (S10) — ask-first: schema change

- **Skills:** `supabase-migration` (mandatory) + `supabase-rls-reviewer` gate
- **Read first:** research §8.4–§8.5, migrations 007/008/018, plan A3/A4

**Contents:**

1. `private.can_create_room(p_user uuid) returns boolean` — security definer,
   pinned search_path, `stable`. TRUE when `plans.max_active_rooms` for
   `private.current_tier(p_user)` is NULL, else when the count of **owned
   active** rooms is strictly `<` the cap. Active per A3:
   `last_active_at > now() - interval '24 hours' OR exists (select 1 from room_members m where m.room_id = r.id)`.
2. `private.can_join_room(p_room uuid) returns boolean` — TRUE when the
   **host's** tier cap `max_room_members` is NULL, else current member count
   strictly `<` cap. (C7: host self-insert at creation passes — count 0.)
3. Drop + recreate `watch_rooms_insert_own` (007) adding
   `and private.can_create_room((select auth.uid()))`; drop + recreate
   `room_members_insert_self` (008) adding `and private.can_join_room(room_id)`.
   Recreate the ORIGINAL clauses verbatim — do not weaken them.
4. Revoke/grant execute on both functions (`authenticated` needs execute — they
   run inside policies of authenticated inserts).

**Safety invariants (blast-radius mitigations, verify in tests):**
existing rooms are never blocked/deleted (A4 — gate is INSERT-only);
`max` tier always TRUE; SELECT/UPDATE/DELETE policies untouched.

**Tests:** static migration assertions (policy text contains both original check
and quota call; functions revoke-then-grant; no other policy touched). Plus
criteria 5–6 behavior tests where a local stack exists (free user's (cap+1)-th
active-room INSERT rejected by Postgres; pro succeeds; full free room join fails).

**Gate:** `supabase-rls-reviewer` + tests; regenerate Supabase types.

### Step 2.3 — Localized quota failures in the app layer (S10 surface)

- **Skills:** `server-action`

**Files:** edit `apps/web/src/features/watch/actions.ts` (`createRoom`),
`apps/web/src/features/watch/queries.ts` (`ensureRoomMembership`),
`apps/web/src/app/api/watch/[roomId]/join/route.ts`; tests in
`apps/web/src/test/features/watch-quota-messages.test.ts`.

**Rules (C8):**

- `createRoom`: insert error with `code === '42501'` → check
  `getEntitlements()`-vs-owned-active-room count to distinguish quota from other
  policy failures is NOT needed — the only new 42501 source on this path is the
  quota; return
  `{ ok: false, message: 'Bạn đã đạt giới hạn phòng đang hoạt động của gói hiện tại. Nâng cấp để tạo thêm phòng.' }`
  plus a `limit_hit`-style audit/analytics hook point (PostHog arrives in 3.3).
- `ensureRoomMembership`: `42501` → throw a typed `RoomFullError` with
  `'Phòng đã đầy theo giới hạn gói của chủ phòng.'`; join route catches it →
  `Response.json({ ok: false, message }, { status: 403 })` (today it 500s everything).
- Keep tolerating `23505` as success in `ensureRoomMembership`.

**Tests:** mocked 42501 on each path → localized message / 403; other errors
still generic (criterion 6 app half).

**Gate:** `bun --filter web test`.

### Step 2.4 — Pricing page + tier badge + upgrade surfaces (S11)

- **Skills:** `feature-module` + `ui-styling` (both mandatory); `react-hook-form` not needed (no form — buttons post Server Actions)
- **Read first:** `docs/conventions/design-system.md`, `docs/conventions/feature-module.md`

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/features/billing/components/pricing-table.tsx` (server component; reads `plans` reference data + `getEntitlements`) |
| Create | `apps/web/src/features/billing/components/tier-badge.tsx`, `upgrade-prompt.tsx` (client; receives entitlements as props) |
| Create | `apps/web/src/app/(app)/pricing/page.tsx`, `apps/web/src/app/(app)/billing/page.tsx` (compose-only route files — no business logic in `app/`) |
| Edit | watch UI: room-create + join failure states render `upgrade-prompt` when the message is the quota message |

**Rules:** UI gating is cosmetic only (Postgres decides — P0). Buttons invoke
`startCheckout` / `openCustomerPortal`. Prices come from Polar-rendered checkout;
the pricing table shows tier quotas read from `plans` (A1 numbers live in DB,
not code). Wrap dynamic entitlements reads in `<Suspense>`; never show gated
content in the fallback. No server data mirrored to Zustand.

**Gate:** `bun --filter web lint typecheck test` + `bun run ai:tw`.

### Step 2.5 — Launch checklist (manual)

Polar live org + 4 live products (ids into prod env), prod
`POLAR_ACCESS_TOKEN`/`POLAR_WEBHOOK_SECRET` (differ from sandbox — A9), webhook
endpoint registered on the prod URL (no redirects — exact host, research §1.5),
firewall allowlist if applicable (research §12.4), Upstash + Sentry prod envs.
Success page reads `getEntitlements` with a short refresh — never fulfills from
the redirect (plan risk #1).

**Phase 2 close:** `bun run ai:premerge` → open PR #3.

---

## Phase 3 — SaaS operations (PR #4, S12–S14)

**Catalog additions:** `inngest` (3.1); `resend`, `@react-email/components` (3.2);
`posthog-js`, `posthog-node` (3.3).

### Step 3.1 — Inngest: durable webhook processing + reconciliation (S12)

- **Skills:** `feature-module`; new ADR (behavior change in failure modes — research §13)
- **Read first:** research §4

**Files**

| Action | File |
|---|---|
| Create | `apps/web/src/features/billing/jobs/client.ts` (`new Inngest({ id: 'pumni-web' })`), `jobs/functions.ts` |
| Create | `apps/web/src/app/api/inngest/route.ts` — `export const { GET, POST, PUT } = serve({ client, functions })` (URL must be `/api/inngest`) |
| Edit | webhook route: after invariant #3 (idempotent insert) → `inngest.send({ name: 'polar/webhook.received', data: { webhookEventId, payload } })` → 200. Steps 4–7 move into the durable function, each side effect in its own `step.run` |
| Edit | `packages/env/src/server-schema.ts` → `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` (optional) |
| Create | `docs/adr/0029-inngest-durable-webhook-processing.md` |

**Functions:** `processPolarWebhook` (event-triggered; short-circuits if
`webhook_events.processed_at` already set), `nightlySubscriptionReconcile`
(`cron: '0 2 * * *'`; Polar `subscriptions.list` vs DB diff → converge DB to
Polar + audit event per fix + flag unknown product ids — criterion 10),
`cleanupStaleRooms` (existing A3 definition; delete-on-empty semantics already
exist in `leave_room` — job only sweeps abandoned rows).

**Fallback path (webhook must not regress):** if Inngest env is absent, the
route processes synchronously as in phase 1 — keep the phase-1 code path behind
that guard rather than deleting it.

**Tests:** reconcile function with fixture drift (DB active / Polar canceled) →
DB converged + audit row (criterion 10); webhook route now enqueues instead of
upserting when Inngest configured. Local: `npx inngest-cli@latest dev`.

**Gate:** `bun --filter web test` + job dry-run.

### Step 3.2 — Resend + react-email (S13) — SKIP-GUARD: A7

If no verified sending domain exists yet, defer this whole step (Polar's own
receipts suffice) — record the deferral in the PR.

- **Read first:** research §5 (SDK never throws — check `{ data, error }`;
  camelCase fields; `react:` called as a function; verified `from` domain)
- **Files:** `apps/web/src/features/billing/emails/{payment-failed,subscription-canceled,subscription-expiring}.tsx`;
  sends happen ONLY inside Inngest steps with
  `idempotencyKey: '<event-type>/<entity-id>'` (research §5.3 — mandatory, else
  Inngest retries double-send); `RESEND_API_KEY` optional in server schema.
- **Tests:** template render snapshots; send step passes idempotencyKey; `error`
  result → Sentry, never user-facing.
- **Gate:** `bun --filter web test`.

### Step 3.3 — PostHog funnel analytics (S14)

- **Read first:** research §6
- **Files:** `apps/web/src/shared/providers/posthog-provider.tsx` (client init +
  `identify(user.id)` after login); `apps/web/src/shared/lib/analytics.ts`
  (`import 'server-only'`; `posthog-node` with `flushAt: 1, flushInterval: 0`,
  `await shutdown()` per capture site); client schema +
  `NEXT_PUBLIC_POSTHOG_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` (optional).
- **Events** (`distinctId` = Supabase `auth.users.id` on BOTH sides — research §12.7):
  `pricing_page_viewed`, `checkout_started` (action), `checkout_completed`
  (webhook `order.paid`/`subscription.active`), `limit_hit` (2.3 hook points),
  `upgraded`, `subscription_canceled`, `subscription_renewed`.
- **Gate:** manual funnel check in PostHog + `bun --filter web lint typecheck`.

### Step 3.4 — Docs sweep (S15 close)

Update: `docs/ai/domain-language.md` (any new terms), golden example already
added in phase 1, `docs/ai/MEMORY.md`, `bun run ai:graph:sync`,
`bun run ai:adr:sync`.

**Gate:** `bun run ai:check` + `bun run ai:eval`.

**Phase 3 close:** `bun run ai:premerge` → open PR #4.

---

## Acceptance criteria → test map (tracking checklist)

| # | Criterion (plan) | Proven in step |
|---|---|---|
| 1 | No raw driver messages from actions | 0.1, 1.4 |
| 2 | 429 on rate-limited paths | 0.3, 1.4 |
| 3 | Webhook idempotency | 1.3, 1.5 |
| 4 | Invalid signature → 401 before any write | 1.3 |
| 5 | Tier flip reflected via `entitlements:{userId}`; RLS blocks (cap+1)-th room | 1.3 + 2.1 (cache), 2.2 (RLS) |
| 6 | Member cap with localized message | 2.2, 2.3 |
| 7 | Cross-user billing isolation; no authenticated writes | 1.1 |
| 8 | Audit rows on billing changes + host transfer | 0.4, 1.3 |
| 9 | Secrets server-only, `server-only` on billing modules | 1.2 (+ grep in phase gates) |
| 10 | Reconciliation converges DB → Polar | 3.1 |
