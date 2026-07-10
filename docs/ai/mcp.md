---
description: How AI agents use the next-devtools MCP server (live Next.js dev-server runtime: errors, routes, browser verify) including security boundaries. Use when debugging a runtime/build error, verifying a route/render change against the running dev server, or inspecting the app's components/logs.
---

# MCP Integration

The repo declares the **next-devtools** (`next-devtools-mcp`) MCP server in `.mcp.json` as a local development aid (never a CI dependency). It acts as a bridge between the MCP client and a running Next.js dev server.

The server is **opt-in and disabled by default locally**
(`disabledMcpjsonServers` in `.claude/settings.local.json`); enable it there
when a task needs the runtime bridge. If the server is not
enabled or not running, fall back to `bun run typecheck`, `bun run build`, and
direct code reads. P0–P4 in `AGENTS.md` always win. Never edit `.mcp.json` to bypass a gate or disable validation.

## Version pin policy

Versions in `.mcp.json` are **pinned to exact releases** (no `@latest`). Bump
intentionally: check npm changelog → edit pin → enable locally → smoke one tool
call → leave disabled-by-default. Never reintroduce `@latest`.

## When MCP is unavailable / handshake fails

- **next-devtools unavailable:** fall back to `bun run typecheck` / `bun run build`
  / direct code reads. **Do not invent runtime errors.**
- **Database schema queries:** fallback to `packages/supabase/src/types.ts` and migrations under `supabase/migrations`. **Do not invent columns, types, or policies.**

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

## 2. Rejected Candidates

- **`@modelcontextprotocol/server-postgres`** — Removed because the upstream package is deprecated on npm, the environment-variable connection configuration (DSN via env) did not match the server's positional argument expectations, and direct static types/migrations are sufficient for schema introspection.
- **`mcp-server-git`** — Excluded as an npm npx-confusion security-research canary (not a real git MCP). Git logs/blame remain shell operations.
- **`@supabase/mcp-server-supabase`** — Excluded because it exposes Storage, auth admin, and Edge Functions under one token (unnecessarily broad trust surface). Direct read-only postgres connection is safer.

