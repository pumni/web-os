---
description: Rules for server-only isolation, "use client" usage, service-role secrets, and state placement. Use when adding "use client", touching the Supabase service-role client, or deciding server vs client code.
---

# Server / Client Boundary

## Core Rules

- **Server-Only Isolation**: Server modules must include `"server-only"` to prevent compilation leaks.
- **Service Role Secrets**: The Supabase service role client must never be exposed to client-side components.
- **Client Interactivity Only**: Use `"use client"` sparingly (e.g. event handlers, local toggle states, form contexts).
- **Route Segment Exports**: Keep Next.js route segment config exports such as
  `unstable_instant` in Server Components. Do not add them to `"use client"`
  pages or components.
- **Security Enforcements**: RLS (Row Level Security) on Supabase schema tables acts as the actual data security boundary. Never rely purely on UI hides.
- **Zustand Limits**: Zustand handles local UI state (sidebar open states, modals). It must not cache server database state.
- **TanStack Query Limits**: Use TanStack Query exclusively for client-driven asynchronous polling, optimistic updates, or paginated lists.

## Next.js Route Props

Prefer global `PageProps<"...">` and `LayoutProps<"...">` helpers when a route
needs typed `params`, `searchParams`, or named slots. Simple layouts that only
accept `children` may keep local `React.ReactNode` typing.
