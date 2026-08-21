# Web feature slices — local delta

Root and `apps/web/AGENTS.md` apply.

- Each feature is a vertical slice behind a small `index.ts` public API.
- Routes may compose feature exports; one feature must not deep-import another
  feature's internals. Tests may use explicit test seams.
- UI components do not call Supabase/auth directly. Keep data access in the
  owning server reads/actions and keep Zustand limited to client UI state.
- Promote code to `src/shared` or a package only after a second real caller or a
  cross-feature contract exists.
- Prefer focused feature tests while iterating, then run the package-local
  lint/typecheck/test gates before finishing.
