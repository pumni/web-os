---
description: Rules for server-only isolation, "use client" usage, service-role secrets, and state placement. Use when adding "use client", touching the Supabase service-role client, or deciding server vs client code.
---

# Server / Client Boundary

## Core Rules

- **Server-Only Isolation**: Server modules must include `"server-only"` to prevent compilation leaks.
- **Service Role Secrets**: The Supabase service role client must never be exposed to client-side components.
- **Client Interactivity Only**: Use `"use client"` sparingly (e.g. event handlers, local toggle states, form contexts).
- **Route Segment Config**: Keep Next.js route segment config exports (e.g.
  `dynamic`, `revalidate`, `fetchCache`) and the `'use cache'` directive in
  Server Components. Never place them in `"use client"` pages or components.
- **Security Enforcements**: RLS (Row Level Security) on Supabase schema tables acts as the actual data security boundary. Never rely purely on UI hides.
- **State Placement**: owned by `docs/conventions/data-fetching.md` (Server Components vs TanStack Query vs Zustand).

## Next.js Route Props

Prefer global `PageProps<"...">` and `LayoutProps<"...">` helpers when a route
needs typed `params`, `searchParams`, or named slots. Simple layouts that only
accept `children` may keep local `React.ReactNode` typing.
