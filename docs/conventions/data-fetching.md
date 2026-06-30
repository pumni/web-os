---
description: When to use Server Components, TanStack Query, and Zustand; state ownership rules. Use when adding data fetching, a query/mutation hook, or any Zustand store.
---

# Data Fetching Convention

## Server-Rendered Components

Use standard Server Components for initial load screens:

- Dashboards page loads
- Profile/Settings initial values
- Public page static assets

When data is safe to reuse across requests, prefer Next.js 16 Cache Components:

- Put `"use cache"` inside the cached server function.
- Tag user-scoped cached reads with `cacheTag(...)`.
- Set an explicit lifetime with `cacheLife(...)`.
- After Server Action mutations that must show fresh user data immediately, call
  `updateTag(...)`.
- Use `revalidateTag(tag, profile)` only for stale-while-revalidate flows or
  Route Handlers; the v16 single-argument form is invalid.

`cacheComponents: true` is enabled (`apps/web/next.config.ts`). To make a route
serve an instant static shell with PPR, mark the cached server function with
`'use cache'`, give it a parameterized `cacheTag(...)` and a safe `cacheLife(...)`,
and wrap every dynamic child in `<Suspense>`. Build-time validation flags a
dynamic read with no cache or Suspense boundary. Protected layouts must keep auth
checks behind a local Suspense boundary with a static fallback shell that does not
render protected children before authentication resolves. Canonical mechanics:
`.claude/rules/nextjs-cache-components.md`.

## Client-Side Asynchronous Querying (TanStack Query)

Delegate data querying to TanStack Query when:

- Performing real-time pagination or search filters
- Infinite-scroll views
- Performing optimistic updates that require instant feedback

## Local State (Zustand)

Use Zustand only for layout-level UI toggle values:

- Opening or closing sidebars
- Rendering system toast events
- Storing active modal context IDs
