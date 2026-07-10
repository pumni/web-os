---
description: When to use Server Components, TanStack Query, and Zustand; state ownership rules. Use when adding data fetching, a query/mutation hook, or any Zustand store.
---

# Data Fetching Convention

## Server-Rendered Components

Use standard Server Components for initial load screens:

- Dashboards page loads
- Profile/Settings initial values
- Public page static assets

When data is safe to reuse across requests, prefer Next.js 16 Cache Components.
Canonical mechanics (placement, `cacheLife`, `cacheTag`, `updateTag`,
`revalidateTag`, PPR/Suspense): `docs/conventions/nextjs-16.md`.

## Client-Side Asynchronous Querying (TanStack Query)

Delegate data querying to TanStack Query when:

- Performing real-time pagination or search filters
- Infinite-scroll views
- Performing optimistic updates that require instant feedback

## Local State (Zustand)

Use Zustand only for layout-level UI chrome and preferences (global UI stores live in `apps/web/src/shared/stores`; feature-local UI state in `features/<feature>/stores`):

- Opening or closing sidebars
- Storing active modal context IDs
- Storing non-sensitive local layout preferences (e.g. density)
- **Never** mirror server data or toast event logs into Zustand; trigger toasts directly using Sonner / `@pumni/ui` toaster primitives.
