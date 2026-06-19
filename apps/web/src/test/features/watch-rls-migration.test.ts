import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

function readMigration17() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/017_harden_watch_queue_rls.sql'),
    'utf8',
  );
}

function readMigration18() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/018_harden_watch_rpcs.sql'),
    'utf8',
  );
}

function readMigration19() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/019_grant_private_schema_usage.sql'),
    'utf8',
  );
}

function readMigration20() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/020_watch_room_heartbeats.sql'),
    'utf8',
  );
}


describe('watch queue RLS hardening migration (017)', () => {
  it('keeps queue reads scoped to room membership', () => {
    const sql = readMigration17();

    expect(sql).toContain('create policy "watch_queue_select"');
    expect(sql).toContain('using (public.is_room_member(room_id)');
  });

  it('derives queue item ownership from auth.uid and narrows update grants', () => {
    const sql = readMigration17();

    expect(sql).toContain('and added_by = (select auth.uid())');
    expect(sql).toContain('grant update(position) on table public.watch_queue_items to authenticated');
  });
});

describe('watch RPC hardening migration (018)', () => {
  it('defines private implementation functions with security definer and set search_path', () => {
    const sql = readMigration18();

    const expectedPrivateFunctions = [
      'private.is_room_member',
      'private.transfer_room_host_impl',
      'private.leave_room_impl',
      'private.claim_room_host_impl',
      'private.get_public_profiles_impl',
    ];

    for (const fn of expectedPrivateFunctions) {
      expect(sql).toContain(`function ${fn}`);
    }

    // Every security definer function should have security definer and search_path set
    const matches = sql.match(/security definer/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(5);

    const paths = sql.match(/set search_path = public, private/g);
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThanOrEqual(9);
  });

  it('defines public wrapper functions with security invoker', () => {
    const sql = readMigration18();

    const expectedPublicFunctions = [
      'public.transfer_room_host',
      'public.leave_room',
      'public.claim_room_host',
      'public.get_public_profiles',
    ];

    for (const fn of expectedPublicFunctions) {
      expect(sql).toContain(`function ${fn}`);
    }

    const matches = sql.match(/security invoker/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  it('recreates watch_queue_items policies using private.is_room_member', () => {
    const sql = readMigration18();

    expect(sql).toContain('private.is_room_member(room_id)');
    expect(sql).toContain('create policy "watch_queue_select" on public.watch_queue_items');
  });

  it('revokes default execution and grants only required access to authenticated', () => {
    const sql = readMigration18();

    // Verify revokes for both private and public functions
    expect(sql).toContain('revoke all on function private.is_room_member(uuid) from public, anon, authenticated;');
    expect(sql).toContain('revoke all on function public.transfer_room_host(uuid, uuid) from public, anon, authenticated;');

    // Verify grants to authenticated
    expect(sql).toContain('grant execute on function private.is_room_member(uuid) to authenticated;');
    expect(sql).toContain('grant execute on function public.transfer_room_host(uuid, uuid) to authenticated;');
  });
});

describe('watch schema usage grant migration (019)', () => {
  it('grants usage on schema private to authenticated', () => {
    const sql = readMigration19();
    expect(sql).toContain('grant usage on schema private to authenticated;');
  });
});

describe('watch room heartbeats migration (020)', () => {
  const sql = readMigration20();

  it('creates the watch_room_heartbeats table', () => {
    expect(sql).toContain('create table public.watch_room_heartbeats');
  });

  it('enforces host boundary for upserts', () => {
    expect(sql).toContain('create policy "watch_room_heartbeats_upsert_host"');
    expect(sql).toContain('using ((select auth.uid()) = host_id)');
    expect(sql).toContain('with check ((select auth.uid()) = host_id)');
  });

  it('does NOT add the table to supabase_realtime publication', () => {
    expect(sql).not.toContain('alter publication supabase_realtime add table public.watch_room_heartbeats');
  });

  it('updates claim_room_host_impl to query watch_room_heartbeats and falls back to watch_rooms', () => {
    expect(sql).toContain('create or replace function private.claim_room_host_impl');
    expect(sql).toContain('from public.watch_room_heartbeats hb');
    expect(sql).toContain('update public.watch_rooms r');
  });

  it('performs host staleness check atomically inside the UPDATE statement to prevent races', () => {
    // Ensure we do not select heartbeat into a variable to check it later
    expect(sql).not.toContain('select hb.heartbeat_at into');
    expect(sql).not.toContain('select r.host_heartbeat_at into');
    // Ensure it is checked inside the update where clause
    expect(sql).toMatch(/update\s+public\.watch_rooms\s+r[\s\S]+?where[\s\S]+?not\s+exists\s*\(\s*select\s+1\s+from\s+public\.watch_room_heartbeats/i);
  });
});

