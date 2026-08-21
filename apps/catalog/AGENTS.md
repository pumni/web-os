# apps/catalog — Storybook component catalog

Root `AGENTS.md` applies. The catalog is an isolated preview surface for
`@pumni/ui`, not a second product app.

## Development & Build Commands

- **Run Dev Server:** `bun run catalog:dev` (runs Storybook on port 61000)
- **Production Build:** `bun run catalog:build` (builds static Storybook assets)
- **Linting:** `bun run catalog:lint`
- **Typechecking:** `bun run catalog:typecheck`

The scripts are prefixed with `catalog:` and stay outside the default gates;
this operational decision is recorded in [ADR-0031](../../docs/adr/0031-ui-platform-contract.md).

## Relationship to `@pumni/ui`

- Make component changes in `packages/ui`, then use the catalog to preview them
  before promotion to `apps/web`.
