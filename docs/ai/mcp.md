---
description: How AI agents use the next-devtools MCP server (live Next.js dev-server runtime: errors, routes, browser verify) including security boundaries. Use when debugging a runtime/build error, verifying a route/render change against the running dev server, or inspecting the app's components/logs.
---

# MCP Integration

The repo declares the **next-devtools** (`next-devtools-mcp`) MCP server in `.mcp.json` launched via `bunx` as a local dev aid (never a CI or build dependency). The server is **opt-in and disabled by default locally**. If unavailable or not running, fall back to native tools (`bun run typecheck`, `bun run build`, and direct code reads). Project invariants in `AGENTS.md` always apply.

## Capability Gap & Strategic Position

`next-devtools` addresses specific capability gaps that native static file tools cannot fulfill:
- Observing live Next.js client-side runtime errors and hydration mismatches.
- Inspecting active dev server component trees and route handler states.
- Running browser-backed visual/console verification via Playwright.

MCP here is a **local dev runtime aid, not a data-provisioning layer.** The repo does not expose code, git, shell, or database through MCP: native coding agents already have superior native capabilities for filesystem and shell operations.

## Version Pin & Removal Policy

- **Version pin:** Versions in `.mcp.json` are **pinned to exact releases** (e.g. `next-devtools-mcp@0.4.0`, never `@latest`).
- **Removal conditions:** An MCP server must be removed or disabled when:
  1. The underlying package is deprecated or unmaintained.
  2. Native agent harness capabilities evolve to replace the MCP functionality.
  3. The trust surface or token cost exceeds actual runtime benefit.

## When MCP is unavailable / handshake fails

- **next-devtools unavailable:** fall back to `bun run typecheck` / `bun run build` / direct code reads. **Do not invent runtime errors.**
- **Database schema queries:** fallback to `packages/supabase/src/types.ts` and migrations under `supabase/migrations`. **Do not invent columns, types, or policies.**

## 1. next-devtools (Runtime Bridge v0.4.0)

`next-devtools-mcp` (v0.4.0+) exposes tools to interact with a running Next.js dev server:
- `nextjs_index` — discovers the running Next.js dev server and lists available runtime tools.
- `nextjs_call` — invokes a runtime tool on the discovered dev server.
- `nextjs_docs` — search/retrieve Next.js documentation installed with the package.
- `browser_eval` — Playwright-backed tool to interact, screenshot, and read console logs.

### Closed-loop workflow:
1. Make code change.
2. Run dev server (`bun run dev`) and note port.
3. Call `nextjs_index` to discover the dev server and list available tools.
4. Call `nextjs_call` to inspect runtime errors or component trees on the dev server.
5. Fix root cause using the evidence.
6. Verify interactions via `browser_eval`.
