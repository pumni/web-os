---
description: Monorepo structure, package boundaries, and module responsibilities for Pumni Web OS.
when-to-load: When adding packages, moving code across the app/package boundary, or reasoning about import direction.
last-reviewed: 2026-06-19
---

# Architecture Overview

## Structural Principles

Pumni Web OS uses a strict monorepo architecture with Bun workspaces and Turborepo. It divides features into isolated workspace modules (packages) and a main application delivery layer (`apps/web`).

```mermaid
graph TD
  Web[apps/web - Next.js App] --> UI[@pumni/ui - Shared UI Primitives]
  Web --> Auth[@pumni/auth - Server Helpers]
  Web --> Supabase[@pumni/supabase - Client Factories]
  Web --> Env[@pumni/env - Env Validator]
  Web --> Validators[@pumni/validators - Schemas]
  Auth --> Supabase
  Supabase --> Env
```

## Modular Structure

1. **`apps/web`**: Next.js App Router orchestration layer. Holds routes, page layouts, client-specific providers, and styles.
2. **`packages/ui`**: Pure React UI primitives. Must never import DB, Server Actions, or business logic.
3. **`packages/env`**: Shared runtime validation of system environment variables.
4. **`packages/validators`**: Zero-dependency Zod validation schemas shared between Client Forms and Server Actions.
5. **`packages/supabase`**: Supabase browser and server connection clients.
6. **`packages/auth`**: High-level authentication checking helpers (`getCurrentUser`, `requireUser`).

## Dependency Graph

For the real `workspace:*` edge map, foundational blocks, and blast-radius
reasoning before cross-package changes, see
`docs/architecture/project-graph.md`.
