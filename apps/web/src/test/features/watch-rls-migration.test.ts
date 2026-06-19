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

