---
name: feature-module
description: Scaffold or extend a vertical feature slice under apps/web/src/features/<feature> with the right split of server reads, Server Actions, client components, and shared packages. Use when starting a new feature, adding files to one, or deciding what to promote into packages/*. For module-internals design, use codebase-design.
---

# Feature Module

A feature is a vertical slice: server reads, mutations, and the UI that uses them
live together under `apps/web/src/features/<feature>`. This skill places each
piece and routes the detail to the matching implementation skill.

## Rules

- Read `docs/conventions/feature-module.md` and `apps/web/AGENTS.md` first.
- Default shape: `features/<feature>/{queries.ts, actions.ts, <feature>-form.tsx
  or components}`. Optionally `client-queries.ts` for browser-side reads and
  `stores/` for feature-scoped Zustand stores.
- Server reads go in `queries.ts` (Server Components, cached); mutations go in
  `actions.ts` (`"use server"` Server Actions); `"use client"` is only for
  interactivity (form state, handlers, optimistic UI, local view state).
- Do not move database reads into client components to avoid prop drilling — pass
  server data down as props.
- Server state ownership: `docs/conventions/data-fetching.md`. Never mirror server
  data into Zustand.
- Validate inputs with `@pumni/validators` schemas; derive the user server-side;
  rely on RLS as the data boundary.
- Promote code into `packages/*` only at a real reuse boundary (`validators`,
  `ui`, `auth`, `supabase`). Do not create placeholder packages.
- Keep route files thin: they compose UI and delegate to the feature module.
- Route the detail to the owning skill: server reads → `server-component-read`,
  mutations → `server-action`, forms → `react-hook-form`, client async →
  `tanstack-query-hook`, UI state → `zustand-store`, schema → `zod-validator`,
  schema/RLS → `supabase-migration`, styling → `ui-styling`.

## Checklist

- [ ] Code lives under `apps/web/src/features/<feature>` with the standard split.
- [ ] Server reads in `queries.ts`; mutations in `actions.ts`; `"use client"`
      only for interactivity.
- [ ] No database reads in client components purely to avoid props.
- [ ] Server/client state ownership respected (no server data in Zustand).
- [ ] Inputs validated via `@pumni/validators`; user derived server-side.
- [ ] Any promotion to `packages/*` sits at a real reuse boundary.
- [ ] Route files stay thin.
- [ ] If this feature establishes a reusable pattern, add one entry to
      `docs/ai/golden-examples.md` (use a `path#symbol` anchor) so agents have a
      local example to copy.
- [ ] `bun run typecheck` and the relevant feature gate pass.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Logic leaked into route files | Page/layout files contain complex fetching or mutation logic. | Move logic into `queries.ts` or `actions.ts`; keep routes for composition only. |
| Server data in Zustand | Server state is manually synced to a Zustand store for UI access. | Read directly from Server Components or use TanStack Query; delete the Zustand mirror. |
| Shared code in wrong package | App-specific logic promoted to `@pumni/*` without a cross-app need. | Move code back to `apps/web/src/features`; only promote truly generic logic. |
