---
description: When a workspace package needs transpilePackages in next.config.ts, and the current repo status. Use when adding a package under packages/, changing a package export shape, or debugging a SyntaxError from a workspace import.
---

# transpilePackages Convention

Next.js (Turbopack) skips transpiling anything inside `node_modules` by default.
Workspace packages are symlinked into `node_modules`, so whether they need
`transpilePackages` depends on what they export.

## Current status

This repo does **not** set `transpilePackages` in `apps/web/next.config.ts`
today. The workspace packages export raw TypeScript source (e.g.
`@pumni/ui/form` -> `./src/components/form/index.ts`) and the production build still succeeds because
Turbopack detects the workspace symlinks and applies its transform pipeline.

Do not add `transpilePackages` "just in case". Add it only when a build, type,
or runtime error proves the transform pipeline is missing a workspace package.

## When transpilePackages is required

Add the package to `transpilePackages: [...]` in `apps/web/next.config.ts` only
if **and only if** one of these is true and a build error confirms it:

- The package exports raw TS/TSX and Turbopack fails to detect the symlink.
- The package uses Next.js-specific directives (`'use client'`, `'use server'`,
  CSS Modules) that need the Next transform pipeline.
- The package relies on `tsconfig.json` `paths` aliases that the bundler cannot
  resolve without transpilation.

## When it is NOT required

- A package already ships compiled ESM/CJS (`dist/index.js`) plus `.d.ts`.
- The build is green and no transpile-related error appears.

If you add or remove `transpilePackages`, run `bun run build` to confirm the
change is actually needed and does not regress bundle size or the Turbopack
cache.
