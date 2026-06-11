---
description: Rules for server-only isolation, "use client" usage, service-role secrets, and state placement.
when-to-load: When adding "use client", touching the Supabase service-role client, or deciding server vs client code.
---

# Server / Client Boundary

## Core Rules

- **Server-Only Isolation**: Server modules must include `"server-only"` to prevent compilation leaks.
- **Service Role Secrets**: The Supabase service role client must never be exposed to client-side components.
- **Client Interactivity Only**: Use `"use client"` sparingly (e.g. event handlers, local toggle states, form contexts).
- **Security Enforcements**: RLS (Row Level Security) on Supabase schema tables acts as the actual data security boundary. Never rely purely on UI hides.
- **Zustand Limits**: Zustand handles local UI state (sidebar open states, modals). It must not cache server database state.
- **TanStack Query Limits**: Use TanStack Query exclusively for client-driven asynchronous polling, optimistic updates, or paginated lists.
