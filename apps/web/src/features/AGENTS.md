# Web feature slices — local delta

Root and `apps/web/AGENTS.md` apply.

- Each feature is a vertical slice behind small explicit public entry points.
  Use `index.ts` for server-safe APIs; add `client.ts` when client components or
  client-safe types need a separate boundary. Do not mix server-only and client
  exports behind one barrel.
- Routes may compose feature exports; one feature must not deep-import another
  feature's internals. Tests may use explicit test seams.
- UI components do not call Supabase/auth directly. Keep data access in the
  owning server reads/actions and keep Zustand limited to client UI state.
