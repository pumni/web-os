# Quality Gates

Run these commands from the repo root before merging framework or starter
changes:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

## Gate Ownership

- `lint` checks application source and packages that opt into linting.
- `typecheck` must cover every package with TypeScript source.
- `test` runs deterministic unit/component tests that do not require external
  services.
- `build` verifies the production Next.js bundle.

End-to-end tests are kept separate because they require a running app and may
require local Supabase:

```bash
cd apps/web
bunx playwright test
```

Do not add placeholder scripts that make a package look covered when it is not.
