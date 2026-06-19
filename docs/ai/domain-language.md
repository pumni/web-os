---
description: Shared vocabulary for Pumni Web OS so agents name concepts, tests, and implementation seams consistently.
when-to-load: Before non-trivial planning, architecture discussion, feature naming, PRD drafting, or when terminology is ambiguous.
---

# Domain Language

Use these terms consistently in plans, tests, file names, and summaries. This
file is a glossary, not a feature spec.

## Product And Architecture

- **Web OS**: the Pumni browser-based operating environment delivered by
  `apps/web`.
- **Feature module**: a cohesive app feature under `apps/web/src/features/*`
  that owns its actions, queries, hooks, components, and local behavior.
- **Surface**: a user-facing area or workflow where a feature is experienced.
- **Package boundary**: an enforced workspace responsibility line described in
  `docs/architecture/overview.md`.
- **Vertical slice**: a narrow end-to-end change that is independently
  verifiable through every layer it touches.

## State And Data

- **Server state**: data owned by the server, Supabase, or remote APIs. Keep it
  in Server Components or TanStack Query cache; do not mirror it into Zustand.
- **Client UI state**: ephemeral browser-only interaction state such as open
  panels, selected tabs, draft toggles, and view preferences. Zustand may own
  this state.
- **RLS boundary**: Supabase Row Level Security as the real data authorization
  boundary. UI hides and client checks are never sufficient access control.
- **Publishable key**: the Supabase browser-safe key exposed through
  `NEXT_PUBLIC_*`.
- **Service-role key**: the privileged Supabase secret key. It is server-only and
  must never enter client bundles.

## Next.js And Caching

- **Server Action**: a server-side mutation entry point, usually in a feature
  module `actions.ts`, with validation, server-derived auth, and cache
  invalidation.
- **Query hook**: a client TanStack Query hook for async server state reads or
  mutations. It must not feed server data into Zustand.
- **Cache tag**: a parameterized Next.js cache invalidation label. Tags must be
  scoped enough to avoid cross-user or cross-resource collisions.
- **Mutation invalidation**: the cache refresh strategy after a write, using
  Next.js cache APIs, TanStack Query invalidation, redirect, or an equivalent
  local update.

## Design

- **Deep module**: a module with a small interface and substantial behavior
  behind it.
- **Seam**: the place where callers and tests cross into a module.
- **Adapter**: a concrete implementation that satisfies an interface at a seam.
- **Feedback loop**: the command, test, script, or harness that proves a bug,
  feature, or regression is red-capable and then green.
