---
name: supabase-migration
description: Author Supabase migrations bundling schema, RLS, policies, grants, and function safety together. Use when adding or changing files under supabase/migrations, enabling RLS, writing owner policies, or hardening an RPC.
---

# Supabase Migration

Use this skill when adding or changing files under `supabase/migrations`.

## Rules

- Read `docs/conventions/supabase-security.md` before writing SQL.
- Put schema, RLS, policies, and Data API grants in the same migration.
- Enable RLS for every table in an exposed schema.
- Revoke broad defaults from `anon` and `authenticated`, then grant only the
  minimum privileges required.
- Owner policies must compare ownership to `auth.uid()`.
- Avoid public `anon` access unless the table is intentionally public.
- Do not place `security definer` functions in exposed schemas.
- Functions must set an explicit `search_path` and revoke execute unless they
  are intentionally callable.
- Regenerate generated Supabase types after schema changes when the project
  workflow requires it.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| A new table is accessible to anyone without authentication | Row Level Security (RLS) is not enabled on the table | Run `alter table public.<table> enable row level security;` in the table's migration |
| API select returns empty array for authorized users | SELECT policies or grants to `authenticated` are missing | Add `create policy ... to authenticated using (...)` and `grant select on table public.<table> to authenticated;` |
| Security definer function allows execution bypass or executes in wrong schema | Function has no explicit `search_path` or execute privileges are broad | Always set `SET search_path = public` (or private schema) and `revoke execute on function ... from public, anon, authenticated` |
| Users can read/write other users' private data | RLS owner policy uses client-supplied parameters instead of server-derived context | Ensure user ownership comparison relies on `auth.uid()` (e.g. `user_id = auth.uid()`) inside the policy using/check clauses |

## Checklist

- [ ] Migration creates or changes the schema object.
- [ ] RLS is enabled for new exposed tables.
- [ ] Policies match the real access model and use `auth.uid()` for owners.
- [ ] Grants are explicit and minimal.
- [ ] RPCs do not trust `p_user_id` without an `auth.uid()` check.
- [ ] Function `search_path` is explicit.
- [ ] `bun run ai:eval` scans clean.
- [ ] `bun run typecheck` passes after type generation when generated types
      changed.
