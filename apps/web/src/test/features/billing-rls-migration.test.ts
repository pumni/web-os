import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

function readMigration22() {
  return readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/022_billing_core.sql'),
    'utf8',
  );
}

describe('Billing core RLS and schema migration (022)', () => {
  const sql = readMigration22();

  it('creates the 4 core billing tables', () => {
    expect(sql).toContain('create table if not exists public.plans');
    expect(sql).toContain('create table if not exists public.billing_customers');
    expect(sql).toContain('create table if not exists public.subscriptions');
    expect(sql).toContain('create table if not exists public.webhook_events');
  });

  it('enables row level security on all 4 tables', () => {
    expect(sql).toContain('alter table public.plans enable row level security;');
    expect(sql).toContain('alter table public.billing_customers enable row level security;');
    expect(sql).toContain('alter table public.subscriptions enable row level security;');
    expect(sql).toContain('alter table public.webhook_events enable row level security;');
  });

  it('grants select only to authenticated and full access to service_role', () => {
    // plans
    expect(sql).toContain('revoke all on table public.plans from anon, authenticated;');
    expect(sql).toContain('grant select on table public.plans to authenticated;');
    expect(sql).toContain('grant select, insert, update, delete on table public.plans to service_role;');

    // billing_customers
    expect(sql).toContain('revoke all on table public.billing_customers from anon, authenticated;');
    expect(sql).toContain('grant select on table public.billing_customers to authenticated;');
    expect(sql).toContain('grant select, insert, update, delete on table public.billing_customers to service_role;');

    // subscriptions
    expect(sql).toContain('revoke all on table public.subscriptions from anon, authenticated;');
    expect(sql).toContain('grant select on table public.subscriptions to authenticated;');
    expect(sql).toContain('grant select, insert, update, delete on table public.subscriptions to service_role;');

    // webhook_events has no authenticated grants
    expect(sql).toContain('revoke all on table public.webhook_events from anon, authenticated;');
    expect(sql).toContain('grant select, insert, update, delete on table public.webhook_events to service_role;');
    expect(sql).not.toMatch(/grant\s+\w+\s+on\s+table\s+public\.webhook_events\s+to\s+authenticated/i);
  });

  it('implements correct RLS select policies for owner access', () => {
    expect(sql).toContain('create policy "plans_select"');
    expect(sql).toContain('on public.plans');
    expect(sql).toContain('create policy "billing_customers_select"');
    expect(sql).toContain('on public.billing_customers');
    expect(sql).toContain('create policy "subscriptions_select"');
    expect(sql).toContain('on public.subscriptions');

    expect(sql).toContain('using ((select auth.uid()) = user_id)');
  });

  it('implements database indexes for performance', () => {
    expect(sql).toContain('create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);');
    expect(sql).toContain(
      'create index if not exists subscriptions_user_status_period_idx on public.subscriptions (user_id, status, current_period_end);',
    );
  });

  it('defines the 3 database functions with security definer and set search_path', () => {
    expect(sql).toContain('function private.current_tier');
    expect(sql).toContain('function private.get_entitlements');
    expect(sql).toContain('function public.get_user_entitlements');

    // All 3 functions should be security definer
    const matches = sql.match(/security definer/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);

    const paths = sql.match(/set search_path = public, private/g);
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThanOrEqual(3);
  });

  it('enforces function execution grants strictly', () => {
    expect(sql).toContain('revoke all on function private.current_tier(uuid) from public, anon, authenticated;');
    expect(sql).toContain('grant execute on function private.current_tier(uuid) to authenticated, service_role;');

    expect(sql).toContain('revoke all on function private.get_entitlements(uuid) from public, anon, authenticated;');
    expect(sql).toContain('grant execute on function private.get_entitlements(uuid) to service_role;');

    expect(sql).toContain('revoke all on function public.get_user_entitlements(uuid) from public, anon, authenticated;');
    expect(sql).toContain('grant execute on function public.get_user_entitlements(uuid) to service_role;');
  });

  it('seeds the plans reference table', () => {
    expect(sql).toContain("insert into public.plans (tier, max_active_rooms, max_room_members) values");
    expect(sql).toContain("('free', 1, 5)");
    expect(sql).toContain("('pro', 10, 20)");
    expect(sql).toContain("('max', null, null)");
  });
});
