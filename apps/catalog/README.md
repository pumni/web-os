# `@pumni/ui` component catalog

A [Storybook](https://storybook.js.org) catalog for browsing `@pumni/ui` components in
isolation with the real token cascade, theme toggle, and personalization
(accent / glass / density). Added by **ADR-0021** (reopening ADR-0010's Storybook
rejection).

## Run

```bash
bun run catalog:dev        # dev server (http://localhost:61000)
bun run catalog:build      # static production build → storybook-static/
bun run catalog:lint
bun run catalog:typecheck
```

The scripts are intentionally prefixed (`catalog:*`) so the catalog is **not**
pulled into the repo's default `turbo` gates (`build` / `typecheck` / `test`) —
per ADR-0021 it must not become a second app the team is obligated to keep green.
They run as dedicated `catalog:*` tasks in `turbo.json`, so they get Turborepo
caching and are invalidated by `@pumni/ui` source changes.

## Conventions

- Stories live in `src/stories/*.stories.tsx`.
- Import components from the `@pumni/ui` subpath barrels (`@pumni/ui/form`,
  `@pumni/ui/layout`, `@pumni/ui/feedback`, `@pumni/ui/identity`, `@pumni/ui/os`).
- The token cascade is wired in `src/styles/globals.css` in the load-bearing order
  (`tokens → brand → theme → personalization`) that `apps/web` and the
  `import-order` drift guard enforce.
- `.storybook/preview.tsx` is the global provider: it syncs Storybook's theme
  toolbar to the `.dark` class and wraps every story in `PersonalizationProvider`.

Stories are a **representative seed set**, not exhaustive. Add a story when a
component's surface family isn't covered yet.
