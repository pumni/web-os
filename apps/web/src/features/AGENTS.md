# Web feature slices

Root and `apps/web/AGENTS.md` apply. This file is the standing rule for
`apps/web/src/features`.

- Each feature is a vertical slice with a small public `index.ts` API.
- Routes compose feature exports; external code must not deep-import another
  feature's internals. Tests under `apps/web/src/test` may use test seams.
- UI components do not call Supabase or auth directly. Server reads/actions own
  data access; Zustand stores hold client UI state only.
- Promote shared code only when a second real caller exists; use `packages/ui`
  for framework-neutral primitives and `packages/validators` for shared Zod.
- Run `bun run lint`, `bun run typecheck`, and `bun run test` for feature changes.
