---
description: Monorepo structure, package boundaries, and module responsibilities for Pumni Web OS. Use when adding packages, moving code across the app/package boundary, or reasoning about import direction.
---

# Architecture Overview

## Structural Principles

Pumni Web OS uses a strict monorepo architecture with Bun workspaces and Turborepo. It divides features into isolated workspace modules (packages) and a main application delivery layer (`apps/web`). Workspace manifests and import/build tooling are the authoritative dependency boundary.

## Modular Structure

1. **`apps/web`**: Next.js App Router orchestration layer. Holds routes, page layouts, and the `src/shared` directory (app shell, providers, cross-feature hooks/lib, global UI stores). Business capabilities live in `src/features/*` vertical slices.
2. **`packages/ui`**: Pure React UI primitives. Must never import DB, Server Actions, or business logic. The public surface is exposed via subpaths only (e.g., `@pumni/ui/form`, `@pumni/ui/layout`), preventing root barrel import side-effects. Component layout and directory structure follow the primitive / identity / shell concern split (ADR-0010) detailed in [packages/ui/AGENTS.md](../../packages/ui/AGENTS.md).
3. **`packages/env`**: Shared runtime validation of system environment variables.
4. **`packages/validators`**: Zero-dependency Zod validation schemas shared between Client Forms and Server Actions.
5. **`packages/supabase`**: Supabase browser and server connection clients.
6. **`packages/auth`**: High-level authentication checking helpers (`getCurrentUser`, `requireUser`).

## Dependency Graph

Workspace `package.json` files are the dependency source of truth. TypeScript,
ESLint import restrictions, tests, and the framework build validate the edges
when their respective boundaries are affected. `bun run policy:check` is limited
to secret exposure and the feature-boundary characterization; it does not
generally prove workspace dependency correctness.
