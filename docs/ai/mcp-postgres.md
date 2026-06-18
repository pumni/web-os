---
description: How AI agents use the postgres MCP server for read-only DB schema introspection, with its hard security boundary.
when-to-load: When you need the live Supabase DB schema (tables, columns, RLS policies, indexes) instead of guessing from generated types.
---

# Postgres MCP (schema introspection)

The `postgres` server (`@modelcontextprotocol/server-postgres`) is a
**schema-introspection aid**. This repo is Supabase-first and reaches Supabase
via REST/PostgREST + keys — there is no direct DB connection string by default.
This MCP adds a *direct* DB read surface, so it carries a hard security boundary.

Use it when `packages/supabase/src/types.ts` looks stale or partial and you need
the real schema (tables, columns, RLS policies, indexes) from the live DB.
Prefer generated types and migrations when they are fresh.

## Security boundary (non-negotiable)

- **Read-only role only.** The connecting role must have `SELECT`-only grants —
  never a role that can write, even on a dev DB.
- **Dev/local DB only, never production.** RLS still applies, but the read-only
  grant is the hard boundary that survives an agent mistake.
- **DSN stays out of git.** The connection string comes from the
  `SUPABASE_DEV_DB_READONLY` env var (`.env*` is gitignored — see
  `requiredAiIgnorePatterns` in `scripts/ai-context.manifest.json`). `.mcp.json`
  holds `${SUPABASE_DEV_DB_READONLY}`, never a literal DSN. If the client does
  not expand `${...}`, export the var in your shell; never paste a real DSN into
  `.mcp.json`.
- This MCP is **not** a substitute for RLS, secrets handling, or the static
  gate. P0–P4 in `AGENTS.md` still win.

## Rejected MCP candidates

Recorded so the selection is not re-litigated:

- **`mcp-server-git`** — excluded: supply-chain canary. The npm package of that
  name is an npx-confusion security-research canary ("not for production use",
  `node-canaries`), not a real git MCP; there is no official
  `@modelcontextprotocol/server-git` on npm. Git blame/log stays a shell op.
- **`@supabase/mcp-server-supabase`** — declined as a scope choice. Official and
  maintained, but it exposes Storage, auth admin, and Edge Functions under one
  personal access token — a broader trust surface than needed. Postgres MCP
  covers the high-value case (schema introspection) with a narrower boundary.

## See also

- `docs/ai/mcp-runtime.md` — the other declared server (`next-devtools`) and the
  general MCP limits/rules.
