---
name: dependency-update
description: Update dependency versions through the root Bun catalog with tiered risk handling and gate verification. Use when asked to update/bump/upgrade dependencies, when bun outdated shows drift, or when changing versions in the root package.json catalog.
---

# Dependency Update (Bun catalog + Turborepo)

All versions live once in the root `package.json` `catalog`; workspaces only
reference `catalog:`. Every update is: change the catalog → `bun install` →
verify the gate. Never write literal versions into workspace `package.json`s.

## Process

Quick-start: `pwsh -File .agents/skills/dependency-update/scripts/bump-check.ps1`
Prints `bun outdated` output + tier reminder in one shot.

1. **See drift:** `bun outdated --filter '*'` (catalog-aware since Bun 1.3).
2. **Classify each update into a tier** (see Rules) before touching anything.
3. **Apply:**
   - In-range minor/patch: `bun update -i` (Space selects, `l` toggles
     range-respecting vs latest), or edit the root catalog and `bun install`.
   - Exact-pinned packages (`next`, `react`, `turbo`, Storybook family): edit
     the catalog by hand, keeping coupled packages in sync (see Rules).
   - Majors: one branch per major; read the package's migration guide first.
4. **Inspect `git diff`:** only the root catalog and `bun.lock` should change;
   workspace files must still say `catalog:`.
5. **Verify:** `bun run ai:premerge`. If the bump touches Storybook, Vite, or
   `@pumni/ui` dependencies, also run
   `bun run catalog:lint && bun run catalog:typecheck && bun run catalog:build`
   (catalog tasks stay outside default gates per ADR-0021).
6. **Commit by tier:** pinned-framework patch = its own commit; in-range batch =
   one `chore(deps)` commit; each major = its own branch/PR.

## Rules

- **Tiers:** (a) patch of exact-pinned framework — bump promptly, isolated
  commit; (b) in-range minor/patch — batch every 1–2 weeks; (c) major — separate
  branch, migration guide read, full gate + e2e/VRT when the UI stack moves.
- **Coupled versions move together:** `next` + `eslint-config-next`;
  `storybook` + all `@storybook/*` + `eslint-plugin-storybook` (identical
  version); `react` + `react-dom` (+ `@types/react`, `@types/react-dom` line).
- **Bun itself:** a Bun bump must update `packageManager`, `engines.bun`, and
  `bun-version` in `.github/workflows/ci.yml` in the same commit.
- `@types/node` major only moves together with the `engines.node` baseline.
- Security posture on demand: `bun audit --audit-level=high --prod`.
- Never change a dependency to solve an unrelated task; version bumps are their
  own change (AGENTS.md: ask first before changing a core dependency).

## Notes

- `bun outdated --filter '*'` catalog-awareness is a Bun 1.3+ behavior; the
  catalog rewriting bug (`oven-sh/bun#21852`) is historical. If a newer Bun
  resolves the rewriting, drop the workspace-`catalog:` reassert step — the
  intent is "workspace files stay on `catalog:`," not "rewrap that line."

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Workspace `package.json`s show literal versions instead of `catalog:` after an update | `bun update` rewrote catalog refs (historical Bun bug, e.g. oven-sh/bun#21852) | Revert the workspace files to `catalog:`, apply the bump in the root catalog only, re-run `bun install` |
| CI fails on `bun install --frozen-lockfile` | Catalog edited without running `bun install`, so `bun.lock` is stale | Run `bun install` locally and commit `bun.lock` with the catalog change |
| Lint behaves differently from `next build` after a Next patch | `next` and `eslint-config-next` diverged | Bump both to the identical version in the catalog |
| Storybook fails to start/build after a partial bump | Mixed `@storybook/*` family versions | Pin the whole family (incl. `eslint-plugin-storybook`) to one version in the catalog |

## Checklist

- [ ] Every version change lives only in the root catalog; workspaces still use `catalog:` / `workspace:*`.
- [ ] `bun.lock` updated and committed with the catalog change.
- [ ] Coupled packages (next/eslint-config-next, storybook family, react pair) moved together.
- [ ] Majors isolated on their own branch with migration notes consulted.
- [ ] `bun run ai:premerge` green; catalog gates run when Storybook/Vite/ui deps changed.
