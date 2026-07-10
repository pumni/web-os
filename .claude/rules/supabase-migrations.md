---
description: P0 reminder for Supabase migrations — path-scoped pointer; loaded only when touching migration files.
paths:
  - "supabase/migrations/**"
---

# Supabase Migrations (pointer)

Canonical: `docs/conventions/supabase-security.md` — read before authoring any migration.

- Invoke the `supabase-migration` skill for every migration change.
- **P0**: RLS is the real data boundary — every new table must have RLS enabled with owner policies before any grant.
- Migrations are immutable history; changes always arrive as a new file bundling schema + RLS + grants.
