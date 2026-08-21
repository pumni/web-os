---
name: supabase-migration
description: Author Supabase migrations bundling schema, RLS, policies, grants, and function safety together. Use when adding or changing files under supabase/migrations, enabling RLS, writing owner policies, or hardening an RPC.
---

# Supabase Migration

Use this skill when adding or changing files under `supabase/migrations`.

Read the security convention first, then use the repository's migrations and
focused tests as the behavioral specification.

## Authoritative references

- Security contract: `docs/conventions/supabase-security.md`.
- Existing migration patterns: `supabase/migrations/`.
- Reusable SQL shape: `.agents/skills/supabase-migration/scripts/migration.template.sql`.
- Focused migration/RLS/quota tests under `apps/web/src/test/` and package test
  directories.
- Generated DB contract: `packages/supabase/src/types.ts` and its package
  workflow.

## Non-obvious invariants

- Committed migrations are immutable history. Add a new numbered migration; do
  not edit an existing one.
- A schema change and its RLS, policies, grants, and function safety belong in
  the same migration when they form one exposed contract.
- `bun run policy:check` is defense-in-depth for static policy/secret checks; it
  is not proof of SQL, RLS, grants, or RPC behavior.

## Procedure

1. Inspect the security convention, affected migrations, schema/types, and the
   focused tests before writing SQL.
2. Add a new migration and keep schema, RLS, policies, minimal grants, and
   function safety cohesive. Derive ownership from `auth.uid()` rather than
   client-supplied identity.
3. Update focused tests when behavior changes. Regenerate database types when
   the schema contract changes; never hand-edit generated output.
4. Run focused migration/security tests and the narrowest affected typecheck.
   Escalate to repository gates when the change crosses packages or changes
   security boundaries.

## Verification

- `bun run test`
- `bun run typecheck` when generated types or shared code changes
- `bun run policy:check` for static secret/architecture defense in depth
