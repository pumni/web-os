---
description: How AI agents connect to the Next.js dev-server runtime via MCP (next-devtools-mcp) for live errors, routes, and browser verification.
when-to-load: When debugging a runtime/build error, verifying a route change, or closing a build-then-verify loop against the running Next.js dev server.
---

# MCP Runtime Integration

The repo declares an MCP server in `.mcp.json` named `next-devtools`
(`next-devtools-mcp`, spawned with `npx`). It is a **bridge** between an MCP
client and a running Next.js dev server, turning the runtime into a context
source instead of a black box.

## When to use it

MCP runtime tools are a **local development aid**, not a CI dependency. Use them
when:

- A build or type error is hard to reason about from the diff alone.
- You changed routing, layouts, or Suspense boundaries and want to confirm the
  rendered structure.
- You need to confirm a hydration/runtime error after a change.

Do not treat MCP availability as required. If the dev server or the MCP client
is not connected, fall back to `bun run typecheck`, `bun run build`, and reading
the touched files — never block a task on MCP.

## How the bridge works (two layers)

`next-devtools-mcp` is a **bridge**: a small fixed set of MCP tools that in turn
talk to a running Next.js dev server. The dev-server capabilities (errors, logs,
component tree, Server Actions, …) are reached **through** the bridge, not as
separate tools. Get this right or calls will look "missing".

The direct tools on the `next-devtools` server (verify against the installed
`next-devtools-mcp@latest`, since names can change between versions):

- `init` — connect the bridge to this Next.js project and discover the running
  dev server. Usually the first call in a session.
- `nextjs_runtime` — given a dev-server port, interact with the dev server's
  built-in MCP runtime: list the runtime tools it exposes and invoke them
  (errors, logs, page/component-tree inspection, Server Actions, …). Use this to
  read live build/runtime state. The exact sub-capabilities are discovered at
  runtime — do not assume a fixed tool name like `get_errors`.
- `nextjs_docs` — search/retrieve the bundled Next.js docs so you follow the
  installed 16.2.9 API instead of stale training-data knowledge.
- `browser_eval` — drive a browser (Playwright-backed) to interact, screenshot,
  and read console warnings.
- `upgrade_nextjs_16` / `enable_cache_components` — guided upgrade helpers; use
  only when explicitly upgrading or enabling a feature.

There is **no** tool literally named `get_routes` or `get_errors` at the bridge
level. For route inspection use `nextjs_runtime` against the dev server, or read
the filesystem under `apps/web/src/app`.

## Closed-loop workflow

1. Make the code change.
2. Ensure `bun run dev` (or `turbo dev`) is running; note its port.
3. `init` the bridge against this project.
4. Use `nextjs_runtime` on the dev port to read build/type/runtime errors and
   inspect the rendered structure. Discover the exact runtime tool names at
   runtime — do not hard-code them.
5. Fix the root cause using the evidence you already have (do not guess).
6. For interaction changes, confirm with `browser_eval`.

## Limits and rules

- MCP reads dev-server state; it is **not** a substitute for RLS, secrets, or
  static gate enforcement. P0–P4 in `AGENTS.md` still win.
- Runtime tool names are discovered, not hard-coded. Always list the dev-server
  capabilities through `nextjs_runtime` first; do not assume a tool exists
  because an older doc mentioned it.
- `NEXT_TELEMETRY_DISABLED=1` is set in `.mcp.json` to opt out of the package's
  anonymous telemetry. Do not remove it without a reason.
- Never change `.mcp.json` to disable validation or to bypass a gate.
- Keep `.mcp.json` minimal. Add new servers only when they provide real runtime
  context — not to broaden tool surface for its own sake.
