# apps/catalog — Storybook Component Catalog (nearest-file rules)

This app is the Storybook component catalog established by ADR-0021, used to develop and preview reusable UI components from the `@pumni/ui` package.

## Development & Build Commands

- **Run Dev Server:** `bun run catalog:dev` (runs Storybook on port 61000)
- **Production Build:** `bun run catalog:build` (builds static Storybook assets)
- **Linting:** `bun run catalog:lint`
- **Typechecking:** `bun run catalog:typecheck`

> [!NOTE]
> The Storybook catalog scripts are prefixed with `catalog:` so they never join the default Turborepo gates (`build` / `lint` / `typecheck` / `test`) — per ADR-0021 the catalog must not become a second app the team is obligated to keep green. They are still registered as dedicated `catalog:*` tasks in `turbo.json`, so runs are cached and graph-aware (`@pumni/ui` changes invalidate them) without pulling Storybook into the main pipeline.

## Relationship to `@pumni/ui`

- The catalog acts as an isolated sandbox for testing design system tokens and component layout.
- Any component changes should be made directly inside `@pumni/ui` (under `packages/ui`) and previewed in the catalog before promotion to `apps/web`.

For general guidelines, security mandates, and routing see the root [AGENTS.md](../../AGENTS.md) and [docs/ai/index.md](../../docs/ai/index.md).
