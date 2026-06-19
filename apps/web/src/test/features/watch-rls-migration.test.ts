import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

function readMigration() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/017_harden_watch_queue_rls.sql'),
    'utf8',
  );
}

describe('watch queue RLS hardening migration', () => {
  it('keeps queue reads scoped to room membership', () => {
    const sql = readMigration();

    expect(sql).toContain('create policy "watch_queue_select"');
    expect(sql).toContain('using (public.is_room_member(room_id)');
  });

  it('derives queue item ownership from auth.uid and narrows update grants', () => {
    const sql = readMigration();

    expect(sql).toContain('and added_by = (select auth.uid())');
    expect(sql).toContain('grant update(position) on table public.watch_queue_items to authenticated');
  });
});
