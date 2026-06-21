---
description: Execution plan to harden watch-room sync, RLS boundaries, RPC safety, and verification.
status: draft
owner: ai-agent
last-reviewed: 2026-06-19
---

# Watch Room Sync and RLS Hardening Plan

This is an implementation handoff for another AI coding agent. The target is to
move the watch-together room mechanism toward a DB-first, RLS-first design where
the database is the authority, Server Actions/RPCs are command boundaries,
Realtime is only notification/delivery, and the client is only UI/projection
state.

## Non-Negotiable Invariants

- RLS is the real data boundary. Do not rely on hidden UI controls for access
  control.
- Never use the Supabase service-role client in watch-room client code or in a
  path callable from a browser bundle.
- Browser Supabase clients use only the publishable key and the current user
  session.
- Do not trust any client-supplied `user_id`, `host_id`, or `added_by` value as
  authority.
- Presence and broadcast messages are not authorization. They can improve UX but
  must not grant access.
- `watch_rooms` is the authoritative playback state. Broadcast can speed up
  reaction time, but persisted room state wins.
- `watch_queue_items` is room-member scoped. Non-members must not read or write
  queue rows.
- Host-only room mutations must be enforced in the database, not only in React.
- If an RPC uses `security definer`, it must set an explicit `search_path`,
  revoke broad execute, and perform its own `auth.uid()` checks.

## Required Context Before Coding

Read these files first:

- `AGENTS.md`
- `docs/ai/index.md`
- `apps/web/AGENTS.md`
- `docs/conventions/supabase-security.md`
- `docs/conventions/server-client-boundary.md`
- `docs/conventions/data-fetching.md`
- `docs/conventions/feature-module.md`
- `.agents/skills/supabase-migration/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

Inspect these runtime paths:

- `apps/web/src/features/watch/actions.ts`
- `apps/web/src/features/watch/action-helpers.ts`
- `apps/web/src/features/watch/queries.ts`
- `apps/web/src/features/watch/hooks/use-room-channel.ts`
- `apps/web/src/features/watch/hooks/use-sync-controller.ts`
- `apps/web/src/features/watch/hooks/use-host-anchor-emitter.ts`
- `apps/web/src/features/watch/hooks/use-host-heartbeat.ts`
- `apps/web/src/features/watch/hooks/use-host-autopromote.ts`
- `apps/web/src/features/watch/components/watch-room.tsx`
- `apps/web/src/features/watch/components/playlist-panel.tsx`
- `apps/web/src/features/watch/components/side-dock.tsx`
- `apps/web/src/app/api/watch/[roomId]/join/route.ts`

Inspect these migrations:

- `supabase/migrations/007_watch_rooms.sql`
- `supabase/migrations/008_room_members.sql`
- `supabase/migrations/009_watch_queue_items.sql`
- `supabase/migrations/011_watch_host_claim.sql`
- `supabase/migrations/014_relax_watch_queue_read.sql`
- `supabase/migrations/016_atomic_watch_host_claim.sql`
- `supabase/migrations/017_harden_watch_queue_rls.sql` if present

Before editing, run:

```bash
git status --short
```

The working tree may already contain unrelated changes. Do not revert files you
did not modify.

## Target Architecture

### Data Authority

`watch_rooms` holds the authoritative playback intent:

- `host_id`
- `source_type`
- `source_ref`
- `is_playing`
- `anchor_position`
- `anchor_server_ts`
- `playback_rate`
- `current_queue_item_id`
- `host_heartbeat_at`

Host clients may persist playback anchors. Followers never directly persist
playback state. Followers receive room updates and reconcile their local media
player to the persisted anchor.

`watch_queue_items` holds collaborative queue state. Queue rows are visible and
mutable only to members of the room.

`room_members` is the membership authority. A user must have a row in
`room_members` before member-scoped queue access is allowed.

### Command Boundaries

Use Server Actions for app commands:

- `createRoom`
- `setRoomSource`
- `joinByCode`
- `leaveRoom`
- `addQueueItem`
- `removeQueueItem`
- `reorderQueue`
- `advanceQueue`
- `transferHost`
- `claimHost`

All Server Actions must:

- call `requireUser()`
- validate input with Zod where structured input is accepted
- derive caller identity from the session
- return explicit `ActionResult`
- rely on RLS/RPC guards as the final boundary

Use RPCs only for operations that need atomic DB behavior or privileged RLS
avoidance:

- membership check helper
- leave-room cleanup
- host transfer
- host claim

### Realtime Boundary

Realtime should only:

- notify clients of DB row changes
- invalidate TanStack Query caches
- deliver ephemeral chat/reaction messages
- track presence for UX

Realtime should not:

- authorize host/follower transitions
- replace DB writes for authoritative state
- make non-members able to read member data

## Implementation Phases

### Phase 0: Confirm Baseline

1. Check whether `017_harden_watch_queue_rls.sql` already exists.
2. Check whether `use-room-membership.ts` already exists.
3. Check current `git status --short`.
4. If these changes already exist, review them instead of duplicating them.

Acceptance:

- The agent can state which hardening items are already present and which remain.

### Phase 1: Harden Queue RLS

Create or update a migration after the latest existing migration.

Target policy behavior for `public.watch_queue_items`:

- SELECT: only authenticated room members can read.
- INSERT: only authenticated room members can insert, and `added_by` must equal
  `auth.uid()`.
- UPDATE: only authenticated room members can update.
- DELETE: only authenticated room members can delete.
- `anon` has no access.
- `authenticated` has only the minimum table grants needed.

Expected SQL shape:

```sql
drop policy if exists "watch_queue_select" on public.watch_queue_items;
drop policy if exists "watch_queue_insert" on public.watch_queue_items;
drop policy if exists "watch_queue_update" on public.watch_queue_items;
drop policy if exists "watch_queue_delete" on public.watch_queue_items;

create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated
  with check (
    public.is_room_member(room_id)
    and added_by = (select auth.uid())
  );

create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null)
  with check (public.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null);

revoke all on table public.watch_queue_items from anon, authenticated;
grant select, insert, delete on table public.watch_queue_items to authenticated;
grant update(position) on table public.watch_queue_items to authenticated;
grant select, insert, update, delete on table public.watch_queue_items to service_role;
```

Important review point:

- If the product intentionally allows members to update `title`, `source_type`,
  or `source_ref`, do not use `grant update(position)` only. Instead grant the
  specific allowed columns and document the reason. Default should be
  `position` only because reorder is the only intended member update.

Acceptance:

- Non-member authenticated users cannot read queue rows.
- Member users can read queue rows.
- Member insert requires `added_by = auth.uid()`.
- Authenticated clients cannot mutate queue ownership columns directly.

### Phase 2: Make Membership Readiness Explicit

Move room join side effects out of `watch-room.tsx` into a focused hook:

```text
apps/web/src/features/watch/hooks/use-room-membership.ts
```

The hook should:

- call `POST /api/watch/:roomId/join`
- retry a small bounded number of times
- invalidate `watchKeys.queue(roomId)` after successful join
- invalidate `watchKeys.room(roomId)` after successful join
- return `{ isJoining, isMemberReady, joinError }`

Do not call `setState` synchronously at the top of an effect. React Compiler
lint can reject that. Prefer initial state keyed by `roomId`, or an async
callback state transition.

In `watch-room.tsx`:

- call `useRoomMembership(room.id, queryClient)`
- pass `isMemberReady` down to the queue UI surface
- keep host/follower calculation based on `currentRoom.host_id === userId`

In `side-dock.tsx` and `playlist-panel.tsx`:

- accept `isMemberReady`
- disable queue commands while `!isMemberReady`
- guard submit/delete/reorder/advance handlers with `if (!isMemberReady) return`

Do not block non-queue playback following while membership join is pending. The
room page can still render the player using server-provided room data.

Acceptance:

- A link joiner cannot attempt queue write before membership setup finishes.
- Queue data refetches immediately after join succeeds.
- The hook is testable without rendering the whole watch room.

### Phase 3: Harden Privileged RPCs

Current RPCs to review:

- `public.is_room_member(uuid)`
- `public.transfer_room_host(uuid, uuid)`
- `public.leave_room(uuid)`
- `public.claim_room_host(uuid)`

Problem:

- Some functions are `security definer` in the exposed `public` schema. The
  convention says privileged helper functions should not live in exposed
  schemas.

Target:

- Move privileged implementation functions to a private schema, for example
  `private`.
- Keep only intentionally callable wrappers exposed through `public` if the
  Supabase Data API needs to call them by RPC.
- All functions must set explicit `search_path`.
- Revoke execute from `public`, `anon`, and broad roles by default.
- Grant only required public wrapper execution to `authenticated`.

Suggested shape:

```sql
create schema if not exists private;

create or replace function private.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_room_member(uuid) from public, anon, authenticated;
```

For policy references, prefer calling the private helper if allowed by Postgres
privileges and Supabase setup. If policy evaluation requires execute grant to
the invoking role, grant only what is necessary and document it in the migration.

For callable RPCs such as `claim_room_host`:

- implementation can live in `private.claim_room_host_impl`
- public wrapper can call it
- public wrapper must still derive caller from `auth.uid()`
- public wrapper should not accept caller user id

Acceptance:

- No privileged `security definer` implementation remains in `public` unless
  there is a documented reason.
- Callable RPC wrappers have explicit grants.
- RPCs do not trust client-supplied user IDs.
- `claim_room_host` remains atomic: stale/missing-host predicate is inside the
  `UPDATE`.

### Phase 4: Clarify Host and Follower Responsibilities

Review the client sync hooks and preserve these responsibilities:

Host:

- persists playback anchors
- heartbeats `host_heartbeat_at`
- changes source
- advances current queue item
- transfers host

Follower:

- receives anchors from room updates
- reconciles local player to expected position
- can temporarily break local sync on manual interaction
- can resync to host
- cannot persist playback anchor

Recommended checks:

- `useHostAnchorEmitter` must no-op when `!isHost`.
- `useHostHeartbeat` must no-op when `!isHost`.
- `useSyncController` must not emit anchors for follower events.
- `RoomControls` should keep host-only controls disabled or hidden for
  followers.
- Direct DB policy on `watch_rooms` must remain `auth.uid() = host_id` for
  update/delete.

Acceptance:

- Follower UI interaction cannot write playback fields.
- Browser-side tampering still fails at RLS when trying to update
  `watch_rooms`.
- Host role changes are driven by `watch_rooms.host_id`, not only presence.

### Phase 5: RLS Integration Tests

Add real RLS tests if the repo has or gains a Supabase local test harness.
Static SQL tests are useful but not sufficient for best-practice confidence.

Required scenarios:

1. Non-member authenticated user cannot select queue rows for a room.
2. Member can select queue rows.
3. Member can insert queue row with `added_by = auth.uid()`.
4. Member cannot insert queue row with another user's `added_by`.
5. Follower/member cannot update `watch_rooms` playback fields.
6. Host can update `watch_rooms` playback fields.
7. Non-host cannot `transfer_room_host`.
8. Host can transfer host to an existing member.
9. Non-member cannot claim host.
10. Concurrent `claim_room_host` attempts result in at most one winner.

If a real Supabase test harness is unavailable, add temporary static tests that
lock the migration intent and open a follow-up issue for integration coverage.

Acceptance:

- The RLS tests run in CI or are documented as a required local gate.
- Tests create separate users/sessions and do not use service-role as the tested
  client.

### Phase 6: Validation

Run the narrowest validation first, then full relevant gates:

```bash
bun --cwd apps/web test src/test/features/watch-room-membership.test.tsx src/test/features/watch-rls-migration.test.ts
bun --cwd apps/web typecheck
bun --cwd apps/web test
bun --cwd apps/web lint
bun run ai:eval
bun run ai:check
```

If migrations alter generated Supabase types, regenerate:

```bash
bun run typecheck
```

Use the repo's actual type generation command if one exists.

Acceptance:

- Typecheck passes.
- Watch tests pass.
- `ai:eval` passes with no security findings.
- `ai:check` passes, except known pre-existing context-size warnings.
- Lint has no new errors. Existing unrelated warnings may be reported but not
  fixed unless in scope.

## Review Checklist

- [ ] Queue select is member-gated.
- [ ] Queue insert binds `added_by` to `auth.uid()`.
- [ ] Queue grants are explicit and minimal.
- [ ] Host-only room updates remain protected by RLS.
- [ ] No watch feature path imports service-role client.
- [ ] Join membership state is explicit in client UI.
- [ ] Queue actions are disabled until membership is ready.
- [ ] Privileged RPCs have explicit `auth.uid()` guards.
- [ ] `security definer` functions are private or documented.
- [ ] Realtime events are treated as notifications, not authorization.
- [ ] Tests cover client membership readiness.
- [ ] RLS integration tests are added or explicitly tracked as follow-up.

## Known Tradeoffs

- Member-gated queue SELECT can reintroduce Supabase Realtime DELETE filtering
  limitations that `014_relax_watch_queue_read.sql` tried to avoid. Prefer DB
  privacy over broad read access. Use broadcast invalidation/refetch as the
  recovery path instead of widening RLS.
- Allowing all members to delete/reorder all queue items is a product decision.
  It is acceptable for an open collaborative playlist, but not for moderated
  rooms. If moderation is required, add roles or owner-scoped queue policies.
- Client-side join is acceptable if queue actions are gated by
  `isMemberReady`. A cleaner future flow is server-side join before rendering
  member-gated data.

## Completion Definition

This project is complete when:

- The database denies non-member queue access.
- The database denies follower playback writes.
- The database prevents spoofed queue ownership.
- Host transfer/claim/leave RPCs are guarded and either private-schema based or
  explicitly justified.
- The client clearly separates host, follower, and membership-ready states.
- Realtime remains a notification layer.
- Validation and tests prove the above without using service-role as the tested
  client.
