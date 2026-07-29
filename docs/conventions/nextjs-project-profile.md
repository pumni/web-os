---
description: Next.js project profile — project decisions, compiler settings, caching configuration, and local boundaries.
---

# Next.js Project Profile

> **Framework API Reference**: For framework APIs, consult installed package docs in `node_modules/next/dist/docs/` or current Next.js documentation. This profile captures project-specific configurations and architectural decisions only.

## Project Configurations

* **Next.js Version**: 16.2 (App Router).
* **React Compiler**: Enabled in `apps/web/next.config.ts`.
* **Cache Components**: `cacheComponents: true` enabled in `apps/web/next.config.ts`.

## Architecture Invariants & Boundaries

1. **Route Layer Composition**: Route files (`apps/web/src/app/**`) compose UI components and feature slices only; business logic and data operations live in `features/*`.
2. **Server/Client Isolation**: Server-only modules carry `"server-only"`. Route-segment config exports (`dynamic`, `revalidate`) and `'use cache'` stay in Server Components.
3. **Data Fetching & Caching**: Server state uses Server Components or TanStack Query; never mirror server state into Zustand.
4. **Validation Command**: Run `bun run lint && bun run typecheck` to verify Next.js routes and component typing.
