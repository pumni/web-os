---
description: How AI agents use the next-devtools MCP server (live Next.js dev-server runtime: errors, routes, browser verify) including security boundaries. Use when debugging a runtime/build error, verifying a route/render change against the running dev server, or inspecting the app's components/logs.
---

# MCP Integration

The repo declares the **next-devtools** (`next-devtools-mcp`) MCP server in `.mcp.json` as a local dev aid (never a CI dependency). The server is **opt-in and disabled by default locally** (`disabledMcpjsonServers` in `.claude/settings.local.json`). If unavailable or not running, fall back to `bun run typecheck`, `bun run build`, and direct code reads. P0–P4 in `AGENTS.md` always win. Never edit `.mcp.json` to bypass a gate or disable validation.

## Strategic position

MCP here is a **local dev runtime aid, not a data-provisioning layer.** The repo does not expose code, git, or database through MCP: the agent has native filesystem + shell access; a database server would widen the token/trust surface. The data plane remains native file reads + `packages/supabase/src/types.ts` + `supabase/migrations`. Revisit only if a target harness lacks native FS/shell.

## Version pin policy

Versions in `.mcp.json` are **pinned to exact releases** (no `@latest`). Bump intentionally: check npm changelog → edit pin → enable locally → smoke one tool call → leave disabled-by-default. Never reintroduce `@latest`.

## When MCP is unavailable / handshake fails

- **next-devtools unavailable:** fall back to `bun run typecheck` / `bun run build` / direct code reads. **Do not invent runtime errors.**
- **Database schema queries:** fallback to `packages/supabase/src/types.ts` and migrations under `supabase/migrations`. **Do not invent columns, types, or policies.**

## 1. next-devtools (Runtime Bridge)

`next-devtools-mcp` exposes tools to interact with a running Next.js dev server:
- `init` — connects the bridge to this Next.js project and discovers the running dev server.
- `nextjs_runtime` — lists and invokes the dev server's runtime tools (errors, logs, page/component-tree, Server Actions, etc.) dynamically.
- `nextjs_docs` — search/retrieve Next.js docs (complements `apps/web/AGENTS.md` + `.claude/rules/*`).
- `browser_eval` — Playwright-backed tool to interact, screenshot, and read console logs.

### Closed-loop workflow:
1. Make code change.
2. Run dev server (`bun run dev`) and note port.
3. Call `init`.
4. Call `nextjs_runtime` on the dev port to inspect errors/structure.
5. Fix root cause using the evidence.
6. Verify interactions via `browser_eval`.

Rejected servers + rationale: ADR-0027.
