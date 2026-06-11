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
