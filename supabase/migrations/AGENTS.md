# Supabase migrations

Root security boundaries apply. Read `docs/conventions/supabase-security.md` and
activate `.agents/skills/supabase-migration/SKILL.md` for migration work.

- Committed migrations are immutable; make changes in a new migration file.
- Bundle schema, RLS enablement, policies, and minimal grants together.
- Every exposed table enables RLS and uses ownership predicates derived from
  `auth.uid()`; never trust client-supplied user IDs for authorization.
- Functions use an explicit `search_path`; avoid `security definer` in exposed
  schemas and revoke execute unless the function is intentionally public.
- Verify security/schema changes with `bun run test` (including the focused
  migration/RLS/quota tests) and the narrowest relevant typecheck. The current
  `bun run policy:check` is defense-in-depth for secret exposure and the
  feature-boundary characterization; it is not proof of SQL/RLS/RPC safety.
