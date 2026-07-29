---
description: How AI agents use the next-devtools MCP server (live Next.js dev-server runtime: errors, routes, browser verify) including security boundaries.
---

# MCP Integration

The optional `.mcp.json` entry exposes the exact-pinned `next-devtools-mcp`
server as a local Next.js runtime aid. It is not a CI, build, filesystem, git,
shell, or database dependency.

Local MCP servers execute with the privileges of the active client. Enable this
server only in a trusted workspace after reviewing the exact command; activation
and consent belong to the client.

Use it for live runtime errors, routes, logs, or browser verification. If it is
unavailable, use native reads and `bun run typecheck` / `bun run build`; never
invent runtime errors, schema, columns, types, or policies.

Keep the exact version pin. Remove the server if it becomes unmaintained, native
harness capabilities replace it, or its trust/token cost exceeds its benefit.
