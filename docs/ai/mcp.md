---
description: How AI agents use the two declared MCP servers — next-devtools (live Next.js dev-server runtime: errors, routes, browser verify) and postgres (read-only DB schema introspection) — including their security boundaries. Use when debugging a runtime/build error, verifying a route/render change against the running dev server, or reading the live Supabase schema instead of guessing from generated types.
---

# MCP Integration

The repo declares two MCP servers in `.mcp.json` as local development aids (never CI dependencies):
1. **next-devtools** (`next-devtools-mcp`) — a bridge between the MCP client and a running Next.js dev server.
2. **postgres** (`@modelcontextprotocol/server-postgres`) — a read-only schema-introspection aid.

Both servers are **opt-in and disabled by default locally**
(`disabledMcpjsonServers` in `.claude/settings.local.json`); enable them there
when a task needs the runtime bridge or live schema. If the servers are not
enabled or not running, fall back to `bun run typecheck`, `bun run build`, and
direct code reads. P0–P4 in `AGENTS.md` always win. Never edit `.mcp.json` to bypass a gate or disable validation.

---

## 1. next-devtools (Runtime Bridge)

`next-devtools-mcp` is a bridge exposing tools to interact with a running Next.js dev server:
- `init` — connects the bridge to this Next.js project and discovers the running dev server.
- `nextjs_runtime` — lists and invokes the dev server's runtime tools (errors, logs, page/component-tree, Server Actions, etc.). Tool names (e.g. for reading errors) are discovered dynamically at runtime, not hard-coded.
- `nextjs_docs` — search/retrieve Next.js docs (complements `apps/web/AGENTS.md` + `.claude/rules/*`).
- `browser_eval` — Playwright-backed tool to interact, screenshot, and read console logs.
- `upgrade_nextjs_16` / `enable_cache_components` — guided upgrade helpers.

### Closed-loop workflow:
1. Make code change.
2. Run dev server (`bun run dev`) and note port.
3. Call `init`.
4. Call `nextjs_runtime` on the dev port to inspect errors and structure.
5. Fix root cause using the evidence.
6. Verify interactions via `browser_eval`.

---

## 2. postgres (Schema Introspection)

Use it when `packages/supabase/src/types.ts` is stale and you need the live DB schema (tables, columns, RLS policies, indexes). Prefer generated types when they are fresh.

### Security boundary (non-negotiable):
- **Read-only role only:** The connecting role must have `SELECT`-only grants.
- **Dev/local DB only, never production:** The read-only grant is the hard boundary surviving agent mistakes.
- **DSN stays out of git:** DSN comes from the `SUPABASE_DEV_DB_READONLY` env var. `.mcp.json` must only reference `${SUPABASE_DEV_DB_READONLY}`, never a literal DSN.

---

## 3. Rejected Candidates

- **`mcp-server-git`** — Excluded as an npm npx-confusion security-research canary (not a real git MCP). Git logs/blame remain shell operations.
- **`@supabase/mcp-server-supabase`** — Excluded because it exposes Storage, auth admin, and Edge Functions under one token (unnecessarily broad trust surface). Direct read-only postgres connection is safer.
