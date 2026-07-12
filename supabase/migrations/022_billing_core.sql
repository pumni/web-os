create table if not exists public.plans (
  tier text primary key check (tier in ('free', 'pro', 'max')),
  max_active_rooms int,
  max_room_members int,
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "plans_select"
on public.plans
for select
to authenticated
using (true);

revoke all on table public.plans from anon, authenticated;
grant select on table public.plans to authenticated;
grant select, insert, update, delete on table public.plans to service_role;

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'polar',
  provider_customer_id text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_customer_id)
);

alter table public.billing_customers enable row level security;

create policy "billing_customers_select"
on public.billing_customers
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.billing_customers from anon, authenticated;
grant select on table public.billing_customers to authenticated;
grant select, insert, update, delete on table public.billing_customers to service_role;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'polar',
  provider_subscription_id text not null,
  tier text not null references public.plans(tier),
  status text not null check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'revoked')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, provider_event_id)
);

alter table public.webhook_events enable row level security;

revoke all on table public.webhook_events from anon, authenticated;
grant select, insert, update, delete on table public.webhook_events to service_role;

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_user_status_period_idx on public.subscriptions (user_id, status, current_period_end);

create or replace function private.current_tier(p_user uuid)
returns text
language plpgsql
security definer
stable
set search_path = public, private
as $$
declare
  v_tier text;
begin
  select tier into v_tier
  from public.subscriptions
  where user_id = p_user
    and status in ('active', 'trialing', 'past_due')
    and (current_period_end is null or current_period_end > now())
  order by case tier
    when 'max' then 3
    when 'pro' then 2
    when 'free' then 1
    else 0
  end desc
  limit 1;

  return coalesce(v_tier, 'free');
end;
$$;

revoke all on function private.current_tier(uuid) from public, anon, authenticated;
grant execute on function private.current_tier(uuid) to authenticated, service_role;

create or replace function private.get_entitlements(p_user uuid)
returns table (
  tier text,
  max_active_rooms int,
  max_room_members int
)
language plpgsql
security definer
stable
set search_path = public, private
as $$
begin
  return query
  select p.tier, p.max_active_rooms, p.max_room_members
  from public.plans p
  where p.tier = private.current_tier(p_user);
end;
$$;

revoke all on function private.get_entitlements(uuid) from public, anon, authenticated;
grant execute on function private.get_entitlements(uuid) to service_role;

create or replace function public.get_user_entitlements(p_user uuid)
returns table (
  tier text,
  max_active_rooms int,
  max_room_members int
)
language plpgsql
security definer
stable
set search_path = public, private
as $$
begin
  return query
  select * from private.get_entitlements(p_user);
end;
$$;

revoke all on function public.get_user_entitlements(uuid) from public, anon, authenticated;
grant execute on function public.get_user_entitlements(uuid) to service_role;

insert into public.plans (tier, max_active_rooms, max_room_members) values
  ('free', 1, 5),
  ('pro', 10, 20),
  ('max', null, null)
on conflict (tier) do update set
  max_active_rooms = excluded.max_active_rooms,
  max_room_members = excluded.max_room_members,
  updated_at = now();
