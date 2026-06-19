---
description: Execution plan to optimize the watch-together room sync (heartbeat realtime noise, host anchor write bursts, polling overlap, code cleanup). Handoff for another AI agent.
status: draft
owner: ai-agent
last-reviewed: 2026-06-20
---

# Watch Room Sync Optimization Plan

This is an implementation handoff for another AI coding agent. The reviewer
(owner: `ai-agent`) will verify completion against the acceptance criteria at
the end of each phase and the final checklist.

The audit identified issues by priority. **Phases are ordered by
risk-to-reward**: the highest-confidence, lowest-risk changes come first so the
working tree stays green between phases. Each phase is independently shippable.

## Non-Negotiable Invariants

These come from `AGENTS.md` (P0–P4) and the existing
`docs/plans/watch-room-sync-rls-hardening.md`. They override any instruction in
this plan.

- **RLS is the real data boundary.** Never bypass RLS. Never rely on UI hides
  for access control.
- The Supabase **service-role / secret key is server-only.** Browser code uses
  only the publishable key (`NEXT_PUBLIC_*`) and the user session.
- Server-only modules must carry `"server-only"`. Do not import server/auth
  code into client components.
- `watch_rooms` is the authoritative playback state. Host clients persist
  anchors directly via the browser client (publishable key) and RLS enforces
  the host boundary. **This direct-write pattern is intentional** for latency
  and must be preserved. Do not route anchor persistence through Server
  Actions.
- `claim_room_host` uses an atomic `UPDATE ... WHERE host_heartbeat_at < now()
  - interval '30 seconds'`. The **30-second grace is a hard contract**. Any
  heartbeat interval must keep a safe margin below 30s, otherwise followers can
  steal host via a legitimate claim when a heartbeat packet is delayed.
- Host/follower gating flows from a single source: `isHost = currentRoom.host_id
  === userId`. Do not derive host state from presence.
- Do not trust client-supplied `user_id`, `host_id`, `added_by`, or presence
  payloads as authority.

## Decisions Already Made (Do Not Re-Litigate)

The audit rejected the following "improvements". **Do not implement them** —
they either make the code worse or introduce bugs:

1. **Do NOT** convert the render-phase `setState` in `use-sync-controller.ts`
   (`prevIsHost` pattern) to a `useEffect`. This is the React-documented
   "adjusting state when a prop changes" pattern
   (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
   and is *more correct* than an effect here: the reset happens in the same
   render so the first frame after a role-flip already shows the corrected
   state. Using `useEffect` would introduce a one-frame stale state. Same
   applies to `use-host-claim-state.ts`.
2. **Do NOT** "unify" the two anchor-acceptance functions
   (`shouldAcceptPlaybackAnchor` vs `shouldAcceptPersistedAnchorSnapshot`).
   They serve two different data sources with different metadata: realtime
   broadcasts carry `sequence` + `originSessionId`; DB row snapshots do not and
   can only be compared by timestamp. Two criteria are required and correct.
3. **Do NOT** route host anchor persistence through Server Actions. The
   direct browser→Supabase write is an intentional RLS-first latency
   optimization. (Only the *heartbeat* table is being moved, not anchors.)
4. **Do NOT** raise the heartbeat interval toward 30s. Grace is 30s; interval
   must stay well below it. The fix for heartbeat noise is moving the column to
   a non-realtime table, not slowing the heartbeat.
5. **Do NOT** implement the "broadcast anchor parallel to DB write"
   optimization (P6 from the audit). It is out of scope for this plan; it adds
   late-joiner complexity and is not warranted without measured latency data.
6. **Do NOT** remove or reduce the 1500ms programmatic window in
   `use-sync-controller.ts`. It exists because YouTube's iframe API emits
   synthetic events where `isOriginTrusted` is unreliable.

## Required Context Before Coding

Read these in order:

- `AGENTS.md` (root) and `apps/web/AGENTS.md`
- `docs/ai/index.md`
- `docs/conventions/supabase-security.md`
- `docs/conventions/feature-module.md`
- `docs/conventions/data-fetching.md`
- `.agents/skills/supabase-migration/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/testing-template/SKILL.md`
- `docs/plans/watch-room-sync-rls-hardening.md` (prior plan — invariants carry
  over)

Inspect these runtime paths (do not edit blindly — read first):

- `apps/web/src/features/watch/hooks/use-host-anchor-emitter.ts`
- `apps/web/src/features/watch/hooks/use-host-heartbeat.ts`
- `apps/web/src/features/watch/hooks/use-sync-controller.ts`
- `apps/web/src/features/watch/hooks/use-room-channel.ts`
- `apps/web/src/features/watch/hooks/use-room-query.ts`
- `apps/web/src/features/watch/hooks/use-recent-rooms-query.ts`
- `apps/web/src/features/watch/hooks/use-host-autopromote.ts`
- `apps/web/src/features/watch/hooks/use-room-chat.ts`
- `apps/web/src/features/watch/queries.ts`
- `apps/web/src/features/watch/sync-math.ts`
- `apps/web/src/features/watch/types.ts`
- `apps/web/src/features/watch/components/watch-room.tsx`
- `apps/web/src/test/features/watch-sync.test.ts`

Inspect these migrations:

- `supabase/migrations/007_watch_rooms.sql`
- `supabase/migrations/008_room_members.sql`
- `supabase/migrations/010_watch_lifecycle.sql`
- `supabase/migrations/011_watch_host_claim.sql`
- `supabase/migrations/016_atomic_watch_host_claim.sql`
- `supabase/migrations/018_harden_watch_rpcs.sql`

Before editing, capture a clean baseline:

```bash
git status --short
bun --cwd apps/web typecheck
bun --cwd apps/web test
bun --cwd apps/web lint
```

Do not revert files you did not modify. If the tree is not clean at start,
note it and work only on files in scope.

## Naming the Next Migration

Find the highest-numbered migration in `supabase/migrations/`. At time of
writing the latest is `019_grant_private_schema_usage.sql`. The next migration
is `020_<name>.sql`. **Verify the actual max before creating the file** — do
not assume `020`.

---

## Phase 0: Baseline & Branch

1. Confirm the tree is clean or note unrelated changes.
2. Create a working branch (do not commit on `main`):
   ```bash
   git checkout -b feat/watch-sync-optimization
   ```
3. Record baseline test output (paste into the PR description later).

**Acceptance:** A branch exists and the agent can quote the baseline `typecheck`
+ `test` + `lint` results.

---

## Phase 1: Debounce Host Anchor DB Persistence (P3)

**Goal:** Stop the write storm when the host scrubs the timeline or toggles
rapidly. Keep the local `anchorRef` update immediate; debounce only the network
write.

### Why this order

Lowest risk, highest immediate value, no schema change. If anything later in
the plan goes wrong, this phase is already shippable on its own.

### File

`apps/web/src/features/watch/hooks/use-host-anchor-emitter.ts`

### Design constraints (critical)

- `anchorRef.current = nextAnchor` must remain **synchronous and immediate**.
  It is the local source of truth used by `useSyncController` on role-flip and
  resync. Debouncing it would make the host's own state stale.
- **Only `persistAnchor` is debounced.**
- The debounce must **flush immediately** on:
  - A transport-state change edge: `overridePlaying` set, or a play/pause
    transition (so followers see pause/play without 250ms extra delay).
  - Component unmount / `isHost` flipping to false (so the final state lands).
- Use a trailing debounce with a **250ms** window. Coalesce intermediate
  anchors; persist the latest.
- Keep the fire-and-forget error log. Do not block the UI on the write.
- The `sequence` and `originSessionId` are still generated per *emitted* anchor
  (not per *persisted* anchor) — sequence monotonicity must be preserved. The
  persisted anchor is whichever anchor won the coalesce window; it carries its
  own (already-incremented) sequence.

### Suggested implementation shape

```ts
// inside useHostAnchorEmitter
const PERSIST_DEBOUNCE_MS = 250;
const pendingAnchorRef = useRef<PlaybackAnchor | null>(null);
const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const flushPersist = () => {
  if (persistTimerRef.current) {
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = null;
  }
  const pending = pendingAnchorRef.current;
  pendingAnchorRef.current = null;
  if (pending) persistAnchorRef.current(pending);
};

const schedulePersist = (anchor: PlaybackAnchor) => {
  pendingAnchorRef.current = anchor;
  if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
  persistTimerRef.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
};

// in emitAnchor:
anchorRef.current = nextAnchor;            // immediate
const isTransportEdge = options?.overridePlaying !== undefined;
if (isTransportEdge) {
  flushPersist();                          // no delay for play/pause intent
  persistAnchorRef.current(nextAnchor);
} else {
  schedulePersist(nextAnchor);
}

// new effect: flush on unmount and on host-role loss
useEffect(() => {
  return () => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const pending = pendingAnchorRef.current;
    if (pending) persistAnchorRef.current(pending);
    pendingAnchorRef.current = null;
  };
}, []);

// flush when isHost flips false so the last anchor lands
useEffect(() => {
  if (!isHost) flushPersist();
}, [isHost]);
```

Adapt to the actual current file structure; the above is guidance, not a
literal patch. Preserve the existing `persistAnchorRef` indirection pattern.

### Test

Add a unit test that does not require a real Supabase client. Mock
`createSupabaseBrowserClient` so `.from().update().eq()` records calls. Verify:

- Calling `emitAnchor` 5 times within 50ms yields **1** persist call (after the
  debounce window advances via fake timers).
- Calling `emitAnchor({ overridePlaying: true })` flushes immediately — the
  persist call happens in the same tick, no debounce wait.
- After unmount, a pending anchor is flushed (use fake timers + a spy on the
  update builder).

File: `apps/web/src/test/features/watch-host-anchor-emitter.test.tsx` (new).
Follow the harness/swap pattern of existing watch tests
(`watch-host-claim.test.tsx`).

**Acceptance:**

- Seek-dragging no longer floods writes; transport intents (play/pause) persist
  immediately.
- Local `anchorRef` stays immediate (the host's own reconcile/resync still sees
  the latest state).
- Unit test covers debounce coalescing, transport-edge flush, and unmount
  flush.
- `bun --cwd apps/web test src/test/features/watch-host-anchor-emitter.test.tsx`
  passes.

---

## Phase 2: Move Heartbeat Off the Realtime Publication (P1)

**Goal:** Eliminate the realtime noise where every 20s heartbeat writes a
`watch_rooms` row that Supabase broadcasts to every client (even though clients
ignore it via signature checks, the payload still crosses the wire and consumes
quota). For a 50-person room this is ~150 redundant messages/minute.

### Approach: dedicated heartbeat table, not realtime-published

Create a new table `public.watch_room_heartbeats` that is **NOT** added to
`supabase_realtime`. The host writes a single row per room (upsert on
`room_id`). `claim_room_host` reads staleness from this table instead of
`watch_rooms.host_heartbeat_at`.

Keep the existing `watch_rooms.host_heartbeat_at` column for one migration as a
**compatibility mirror** (the RPC keeps it updated) so a rolling deploy cannot
lose liveness if old and new code run together. A later migration can drop it;
do not drop it in this plan.

### Why not the rejected alternatives

- "Raise interval to 25–28s" — rejected: 30s grace makes this a host-theft risk
  under packet jitter. Explicitly forbidden (see Invariants).
- "Use Presence as liveness" — rejected: the DB-layer `claim_room_host` RPC
  cannot see Presence state; bridging Realtime → Postgres is out of scope and
  fragile.

### Migration file

`supabase/migrations/0NN_watch_room_heartbeats.sql` (use the real next number).

```sql
-- Dedicated host-liveness table, intentionally NOT in supabase_realtime so
-- heartbeats do not fan out a watch_rooms row to every client every 20s.
create table public.watch_room_heartbeats (
  room_id      uuid primary key references public.watch_rooms(id) on delete cascade,
  host_id      uuid not null references auth.users(id) on delete cascade,
  heartbeat_at timestamptz not null default now()
);

create index watch_room_heartbeats_host_idx
  on public.watch_room_heartbeats(host_id);

alter table public.watch_room_heartbeats enable row level security;

-- Only the room's current host may upsert its heartbeat. This mirrors the
-- watch_rooms update policy (auth.uid() = host_id).
create policy "watch_room_heartbeats_upsert_host"
  on public.watch_room_heartbeats for all to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

revoke all on table public.watch_room_heartbeats from anon, authenticated;
grant insert, update, delete on table public.watch_room_heartbeats to authenticated;
grant select, insert, update, delete on table public.watch_room_heartbeats to service_role;

-- NOTE: deliberately NO `alter publication supabase_realtime add table ...`.
```

Update `claim_room_host` (both the `private.claim_room_host_impl` from 018 and
its public wrapper) so the staleness predicate reads the new table. Mirror
`watch_rooms.host_heartbeat_at` for backward compat by writing both in the same
statement.

```sql
create or replace function private.claim_room_host_impl(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_grace interval := interval '30 seconds';
  v_updated integer := 0;
  v_host_heartbeat timestamptz;
begin
  if not private.is_room_member(p_room_id) then
    raise exception 'Chỉ thành viên trong phòng mới có thể nhận quyền chủ phòng';
  end if;

  -- Prefer the dedicated heartbeat table; fall back to watch_rooms column if no
  -- row exists yet (rolling-deploy safety).
  select hb.heartbeat_at into v_host_heartbeat
  from public.watch_room_heartbeats hb
  where hb.room_id = p_room_id;

  if v_host_heartbeat is null then
    select r.host_heartbeat_at into v_host_heartbeat
    from public.watch_rooms r
    where r.id = p_room_id;
  end if;

  update public.watch_rooms r
  set host_id = (select auth.uid()),
      host_heartbeat_at = now(),
      updated_at = now()
  where r.id = p_room_id
    and (
      v_host_heartbeat is null
      or v_host_heartbeat < now() - v_grace
      or not exists (
        select 1 from public.room_members m
        where m.room_id = r.id and m.user_id = r.host_id
      )
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Chủ phòng hiện tại vẫn đang hoạt động';
  end if;

  -- The new host owns the heartbeat row now.
  insert into public.watch_room_heartbeats (room_id, host_id, heartbeat_at)
  values (p_room_id, (select auth.uid()), now())
  on conflict (room_id) do update
    set host_id = excluded.host_id,
        heartbeat_at = excluded.heartbeat_at;
end;
$$;
```

Also update the older standalone `public.claim_room_host` if `016` still ships
its own body — but since `018` already replaced it with a wrapper around
`private.claim_room_host_impl`, editing the private impl is sufficient. Verify
by reading `018` again before editing. The atomic predicate must stay **inside
the `UPDATE`** (do not split into a separate precheck; the prior plan's P3
requires this).

### Client hook change

`apps/web/src/features/watch/hooks/use-host-heartbeat.ts`:

- Write to `watch_room_heartbeats` instead of `watch_rooms`.
- Use an **upsert** keyed on `room_id` with `{ onConflict: 'room_id' }`. Include
  `host_id` so the RLS `with check` passes.
- Keep the 20s interval and the immediate first beat. Do not change the
  cadence.
- Guard with `isHost` as today.

```ts
const beat = () => {
  void supabase
    .from('watch_room_heartbeats')
    .upsert(
      { room_id: roomId, host_id: userId, heartbeat_at: new Date().toISOString() },
      { onConflict: 'room_id' },
    );
};
```

This requires `userId` — add it to the hook signature. Update the call site in
`watch-room.tsx` (`useHostHeartbeat(currentRoom.id, userId, isHost)`).

### Do not remove `host_heartbeat_at` from select lists yet

`queries.ts`, `use-room-query.ts`, `use-recent-rooms-query.ts`, and generated
types still reference `watch_rooms.host_heartbeat_at`. Leave them — the column
is still mirrored by the RPC. Removing the column is a separate future
migration once all clients write the new table.

### Regenerate types

After applying the migration locally, regenerate the Supabase TypeScript types
so `watch_room_heartbeats` appears in `Database['public']['Tables']`. Use the
repo's actual type generation command (check `package.json` scripts and
`docs/conventions/supabase-security.md`). If no generator is wired up, document
the manual step in the PR.

### Test

`apps/web/src/test/features/watch-rls-migration.test.ts` already exists — extend
it (or add a sibling `watch-heartbeat.test.ts`) to assert:

- The `watch_room_heartbeats` table exists and is **not** in
  `supabase_realtime` membership (static migration assertion — parse the
  migration files to confirm no `alter publication supabase_realtime add table
  public.watch_room_heartbeats` line).
- The host upsert policy enforces `auth.uid() = host_id` (if a real RLS harness
  exists; otherwise a static policy-shape assertion as in the existing test
  file).

**Acceptance:**

- A 20s heartbeat no longer triggers a `watch_rooms` row broadcast. (Verify in
  the browser DevTools network/WS panel: with the room open and host active,
  no new `watch_rooms` `UPDATE` payloads appear on the heartbeat cadence.)
- `claim_room_host` still rejects claims while the host is live and still
  allows claims once the heartbeat is >30s stale.
- Backward-compat mirror keeps `watch_rooms.host_heartbeat_at` populated, so a
  mixed-version deploy does not lose liveness.
- Migration and RPC changes pass the existing/static RLS tests.

---

## Phase 3: Reduce Redundant Room Polling (P3/P4)

**Goal:** `useRoomQuery` and `useQueueQuery` poll every 45s while the realtime
channel already delivers the same data via `postgres_changes` (room) and
broadcast (queue). The 45s poll is documented as "recovery" but fires even when
the connection is live.

### Approach

Convert the polling from an aggressive "recovery-ish" cadence to a true
low-frequency fallback. Keep it enabled (do **not** set `refetchInterval:
false`) — that is the rejected extreme: a silently-disconnected realtime
channel with no poll would leave stale data indefinitely.

### Files

- `apps/web/src/features/watch/hooks/use-room-query.ts`
- `apps/web/src/features/watch/hooks/use-room-queue.ts`

### Change

Introduce a single constant for the long recovery interval and use it in both
hooks (they already share `WATCH_ROOM_STALE_MS` and
`WATCH_ROOM_RECOVERY_REFETCH_MS`; extend the pattern).

```ts
// use-room-query.ts
export const WATCH_ROOM_STALE_MS = 30_000;
export const WATCH_ROOM_RECOVERY_REFETCH_MS = 5 * 60_000; // 5 min pure fallback
```

Bump `staleTime` consideration: `staleTime: 30_000` is fine; the realtime
channel invalidates on real changes, and the 5-min poll covers silent
disconnects.

Keep:
- `refetchIntervalInBackground: false` (already present).
- `refetchOnReconnect: 'always'` — this is the correct recovery hook for a
  network drop. Keep it.
- `refetchOnWindowFocus: 'always'` — keep; cheap and correct.

Update `use-room-queue.ts` to import the renamed/shared constant (it already
imports both from `use-room-query.ts`).

### Why 5 minutes and not never

A realtime channel can drop without emitting a terminal status (long-lived WS
with a dead NAT timeout). The 5-min poll is the safety net. 45s was simply too
aggressive given realtime already delivers updates.

### Test

No new unit test required (this is a config change). Add a short comment above
the constant explaining the rationale so a future reader does not "optimize" it
back down.

**Acceptance:**

- No 45s HTTP polling visible in DevTools during an active, connected session;
  recovery polls at most every 5 min.
- Reconnect still triggers an immediate refetch (manual test: toggle offline /
  online in DevTools).

---

## Phase 4: Code Cleanup (P3 comments)

**Goal:** Remove the duplicate/misplaced comment block and unify comment
language to English for consistency with the rest of the codebase.

### Files & exact edits

1. **`apps/web/src/features/watch/hooks/use-sync-controller.ts`**
   - **Delete lines 121–126** (the misplaced "Robust play: browsers block
     unmuted autoplay..." block). That comment belongs above `tryPlay` at line
     ~134, where a correct copy already exists. Keeping both is the
     copy-paste artifact.
   - Translate the Vietnamese comments to English:
     - The programmatic-window comment near line 124 (the surviving one) →
       English describing the 1500ms window and the YouTube synthetic-event
       reason.
     - The block near line 243–248 about "Mỗi anchor nhận được là MỘT lệnh
       transport có chủ đích" → English: "Each accepted anchor is a deliberate
       transport command from the host; re-engage following and reconcile even
       if the follower had manually broken sync."

2. **`apps/web/src/features/watch/hooks/use-host-autopromote.ts`**
   - Line 7 (`RETRY_MS` comment), line 29 ("Ứng viên..."), line 49 ("DB từ chối
     êm..."), lines 51–52 ("Thử ngay...") → translate to English, preserving
     the intent (DB 30s staleness is the source of truth; retry until it
     passes; on success `host_id` flips and the effect cleans up).

3. **`apps/web/src/features/watch/hooks/use-room-chat.ts`**
   - Line 23 ("Nhận từ người khác — lọc trùng theo id...") → English.
   - Line 51 (`// tự append (self:false) — đi qua bộ lọc trùng`) → English.

### Translation rules

- Preserve technical accuracy. Do not paraphrase away the "why".
- Match the existing English comment style in the file (sentence case, period
  at end, `// ` prefix).
- Do not touch user-facing strings (toast messages, UI labels) — those are
  intentionally Vietnamese and are product copy, not code comments.
- Do not touch SQL migration comments — those are historical record and should
  not be retro-edited. Only translate comments in `.ts`/`.tsx` runtime files.

### Acceptance

- `rg` (or Grep) for common Vietnamese diacritics in
  `apps/web/src/features/watch/hooks/*.ts` returns only user-facing strings
  (toast/label text), no code comments.
- No duplicate "Robust play" comment block.
- No behavior change; this phase is comment-only. `typecheck` + `test` + `lint`
  unchanged from Phase 3 baseline.

---

## Phase 5: Minor Hardening (P4, optional but cheap)

Only do this if Phases 1–4 are green and time permits. Each item is
independent.

### 5a. Guard broadcast against channel state

`apps/web/src/features/watch/hooks/use-room-channel.ts` — the four
`broadcast*` callbacks check `channelRef.current` but not join state. The
re-track effect at line ~218 already uses `ch.state === 'joined'`. Make the
broadcast callbacks consistent:

```ts
const broadcastQueueEvent = useCallback((event: QueueBroadcastEvent) => {
  const ch = channelRef.current;
  if (ch && ch.state === 'joined') {
    ch.send({ type: 'broadcast', event: 'queue', payload: event });
  }
}, []);
```

Apply the same guard to `broadcastRoomEvent`, `broadcastChat`,
`broadcastReaction`. Rationale: Supabase `send` queues internally, but
explicitly checking join state avoids sending before subscription and makes the
intent obvious. Low risk.

### 5b. Pause follower reconcile when tab is hidden (decide per product)

`use-sync-controller.ts` runs `setInterval(reconcile, 1000)` regardless of
`document.hidden`. **Before implementing, decide product intent:**

- If followers are expected to keep listening to audio while the tab is hidden
  (background audio), do **not** gate on `document.hidden` — audio would drift
  uncorrected for the hidden duration and snap on focus.
- If background audio is not a supported use case, add a
  `document.visibilitychange` listener that pauses the interval while hidden
  and runs one immediate `reconcile` on visibility return.

**Default recommendation:** leave as-is (do not gate). Hidden-tab audio
correctness matters more than the negligible CPU of a 1s interval. Only
implement the gate if the team confirms background audio is unsupported.
Document the decision in a comment either way.

**Acceptance (only if implemented):** A comment records the product decision;
behavior matches the decision.

---

## Final Validation

Run in order. Each must pass before moving on.

```bash
# 1. Targeted watch tests
bun --cwd apps/web test src/test/features/watch-sync.test.ts
bun --cwd apps/web test src/test/features/watch-host-anchor-emitter.test.tsx
bun --cwd apps/web test src/test/features/watch-rls-migration.test.ts
bun --cwd apps/web test src/test/features/watch-host-claim.test.tsx
bun --cwd apps/web test src/test/features/watch-reorder.test.ts

# 2. Full fast test suite
bun --cwd apps/web test

# 3. Typecheck (regenerated types must be committed if Phase 2 ran)
bun --cwd apps/web typecheck

# 4. Lint
bun --cwd apps/web lint

# 5. Enforcement gates
bun run ai:check
bun run ai:eval
```

Expected outcomes:

- `ai:eval` passes with no new security findings.
- `ai:check` passes (known pre-existing context-size warnings are acceptable;
  call them out, do not fix out-of-scope).
- No new lint errors. Pre-existing unrelated warnings may be reported but must
  not be "fixed" unless in scope.

## Manual Verification (for the PR description)

These cannot be asserted in CI; the implementing agent should perform them in a
local Supabase + browser and record observations:

1. **Heartbeat noise gone.** With host active and DevTools WS open, confirm no
   `watch_rooms` UPDATE payloads appear every 20s. Confirm the
   `watch_room_heartbeats` row's `heartbeat_at` advances every 20s (query the
   table).
2. **Host claim still works.** Stop the host tab (do not just close — suspend
   the machine or block network for >30s) and confirm a follower's
   `claimHost` succeeds.
3. **Seek-drag write coalescing.** As host, scrub the timeline rapidly for 2s.
   Confirm the number of `watch_rooms` UPDATEs is far lower than before
   (roughly one per 250ms window, not one per animation frame). Confirm
   followers still converge to the final position.
4. **Play/pause latency preserved.** Clicking host play/pause persists within
   the same tick (no 250ms debounce on the transport edge); followers react.
5. **Polling cadence.** With the tab focused and connected, confirm no 45s
   room/queue refetch; a refetch appears at most every ~5 min, and immediately
   on reconnect.

## Review Checklist (for the verifier)

- [ ] No `service-role` import in any client (`rg "service_role"` in
  `apps/web/src/features/watch`).
- [ ] `claim_room_host` staleness predicate still atomic inside the `UPDATE`.
- [ ] Heartbeat interval is still 20s (not raised toward 30s).
- [ ] `watch_room_heartbeats` is NOT in `supabase_realtime`.
- [ ] Host anchor `anchorRef` update is synchronous; only persistence is
  debounced.
- [ ] Transport-edge (`overridePlaying`) anchor persists immediately.
- [ ] Pending anchor is flushed on unmount and on `isHost` flip to false.
- [ ] No duplicate "Robust play" comment; no Vietnamese in `.ts`/`.tsx` code
  comments (user-facing strings excepted).
- [ ] Render-phase `setState` patterns in `use-sync-controller.ts` and
  `use-host-claim-state.ts` were NOT converted to `useEffect`.
- [ ] The two anchor-acceptance functions were NOT merged.
- [ ] Anchor persistence was NOT routed through Server Actions.
- [ ] `WATCH_ROOM_RECOVERY_REFETCH_MS` is 5 min, not 45s, not `false`.
- [ ] Broadcast callbacks (Phase 5a) check `state === 'joined'` if implemented.
- [ ] All validation commands green; observations recorded in the PR.

## Risks / Follow-up

- **Phase 2 rolling deploy:** keep `watch_rooms.host_heartbeat_at` mirrored
  until all clients run the new heartbeat-writer. A follow-up migration (not in
  this plan) drops the column and removes it from select lists once verified in
  production.
- **Phase 1 debounce edge:** if the transport-edge detection misses a case
  (e.g. a pause triggered without `overridePlaying`), followers could see a
  250ms delay on that state change. The unit test must enumerate the edge
  cases. If unsure, flush on any `isPlaying` transition, not only on
  `overridePlaying`.
- **Type regeneration:** if the repo has no wired Supabase type generator, the
  `watch_room_heartbeats` row type must be added to
  `packages/supabase/src/types.ts` by hand following the existing table shape.
  Flag this in the PR so the reviewer can sanity-check.
- **Out of scope, explicitly:** broadcast-anchor-for-latency (audit P6),
  presence-based liveness, dropping `host_heartbeat_at`, converting
  render-phase setState, merging anchor acceptance, Server-Action anchor
  persistence.
