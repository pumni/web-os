---
description: Rules for server-only isolation, "use client" usage, service-role secrets, and state placement. Use when adding "use client", touching the Supabase service-role client, or deciding server vs client code.
---

# Server / Client Boundary

## Core Rules

- **Server-Only Isolation**: Server modules must include `"server-only"` to prevent compilation leaks.
- **Service Role Secrets**: The Supabase service role client must never be exposed to client-side components.
- **Client Interactivity Only**: Use `"use client"` sparingly (e.g. event handlers, local toggle states, form contexts).
- Route props & segment config: see `docs/conventions/nextjs-16.md`.
- **Security Enforcements**: RLS (Row Level Security) on Supabase schema tables acts as the actual data security boundary. Never rely purely on UI hides.
- **State Placement**: owned by `docs/conventions/data-fetching.md` (Server Components vs TanStack Query vs Zustand).

