---
description: When to use Server Components, TanStack Query, and Zustand; state ownership rules.
when-to-load: When adding data fetching, a query/mutation hook, or any Zustand store.
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

For routes that should navigate instantly with `cacheComponents: true`, export
`unstable_instant` from server route segments and let build-time validation catch
missing cache or Suspense boundaries. Protected layouts must keep auth checks
behind a local Suspense boundary with a static fallback shell that does not
render protected children before authentication resolves.

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
