# Supabase migrations

Root security boundaries apply. Read `docs/conventions/supabase-security.md` and
activate `.agents/skills/supabase-migration/SKILL.md` for migration work.

- Committed migrations are immutable; make changes in a new migration file.
- Bundle schema, RLS enablement, policies, and minimal grants together.
- Every exposed table enables RLS and uses ownership predicates derived from
  `auth.uid()`; never trust client-supplied user IDs for authorization.
- Functions use an explicit `search_path`; avoid `security definer` in exposed
  schemas and revoke execute unless the function is intentionally public.
- Verify with `bun run policy:check` and the narrowest relevant typecheck.
