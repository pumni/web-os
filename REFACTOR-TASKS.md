# Multi-Agent Refactor — Coordination Board

Heterogeneous AI agents (Claude Code, Codex, Gemini, opencode — any model) working
the same repo in parallel. This file is the **coordinator's board**, owned by the
human. Instructions live in `AGENTS.md` (the single source of truth every tool
reads); this file only tracks _who owns what_ and _how work merges_.

## Ground rules (non-negotiable)

1. **One file = one owner.** Two agents must never edit the same file. Split work
   by package / feature boundary, never by "both touch this file from two sides".
2. **Read `AGENTS.md` first.** P0 security mandates (RLS is the data boundary,
   service-role key is server-only) are immutable for every agent.
3. **Each agent = its own git worktree on its own branch.** No agent works in the
   main checkout (`D:/Dev/web-os`).
4. **Nothing merges until the shared gate is green** (below) — regardless of which
   agent or model produced the code. Trust the gate, not the tool.
5. **Merge sequentially.** After each merge, rebase the remaining branches onto the
   new `main` to surface conflicts early.
6. Keep agent count to **3–5**. Beyond that, review burden eats the speedup.

## Merge gate — run ONLY the tier matching what your branch changed

This mirrors the existing rule in `AGENTS.md` → **Validation** ("run the gate that
matches what you changed"). A **pure code-refactor session does NOT run the
context-layer commands** (`ai:eval`, `check-ai-context`). Pick one tier:

| Your branch touches…                                                                              | Gate to run before merge                            |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Code only** (`apps/`, `packages/` source)                                                       | `bun run lint && bun run typecheck && bun run test` |
| Code that edits **Tailwind classes** (UI)                                                         | also `bun run ai:tw`                                |
| **Next config / bundle** (`next.config`, build)                                                   | also `bun run build`                                |
| **Context layer** (`AGENTS.md`, `docs/`, `.claude/rules`, `.agents`, `scripts/check-*`, manifest) | `bun run ai:check && bun run ai:eval`               |

Notes:

- `bun install` first (worktrees do NOT share `node_modules`).
- Scope tests to your package to stay fast: `bunx turbo test --filter=@pumni/ui`.
- `ai:check` bundles `check-ai-context` **+** `ai:tw`. For a pure code branch you
  want `ai:tw` only, not the full `ai:check` — call `ai:tw` directly.
- `bun run ai:premerge` (the full `ai:check && ai:eval && lint && typecheck && test
&& build`) is **only** for a branch that genuinely changed both code and context
  layer, or as a final integration sweep by the coordinator — not per-agent on a
  pure code refactor.

## Worktree setup (`.worktrees/` is gitignored)

```
git worktree add .worktrees/<scope> -b refactor/<scope>   # from main checkout
cd .worktrees/<scope>
bun install
```

When the branch is merged:

```
git worktree remove .worktrees/<scope>
```

List active worktrees any time with `git worktree list`.

## Ownership matrix

Assign each agent a disjoint set of paths. `status`: `unassigned` / `in-progress`
/ `in-review` / `merged`. **Keep owners disjoint** — that is what prevents conflicts.

| Scope (paths)                                     | Owner (tool/model) | Branch                   | Status     |
| ------------------------------------------------- | ------------------ | ------------------------ | ---------- |
| `packages/ui/**`                                  | —                  | `refactor/ui`            | unassigned |
| `packages/validators/**`                          | —                  | `refactor/validators`    | unassigned |
| `packages/auth/**`                                | —                  | `refactor/auth`          | unassigned |
| `packages/supabase/**` + `supabase/migrations/**` | —                  | `refactor/supabase`      | unassigned |
| `apps/web/src/features/watch/**`                  | —                  | `refactor/watch`         | unassigned |
| `apps/web/src/features/profile/**`                | —                  | `refactor/profile`       | unassigned |
| `apps/web/src/features/sky-player/**`             | —                  | `refactor/sky-player`    | unassigned |
| `apps/web/src/features/design-system/**`          | —                  | `refactor/design-system` | unassigned |

Other packages available to assign: `@pumni/config`, `@pumni/env`,
`@pumni/features`, `@pumni/test-utils`, `@pumni/workflows`. Other feature:
`design-trends`.

## High-collision zones — coordinate explicitly, never split blindly

- **Barrel files**: `packages/ui/src/index.ts` and every
  `packages/ui/src/components/*/index.ts`. If two agents add exports here they
  WILL conflict. Assign all of `packages/ui` to one owner, or have only the UI
  owner touch barrels.
- **Catalog / config**: `package.json` (root catalog), `turbo.json`,
  `tsconfig*.json` — version bumps from multiple branches collide. Owner = whoever
  holds the dependency change; others rebase.
- **Shared types**: `packages/supabase/src/types.ts` is generated — never
  hand-edit; regenerate on the migration branch only.

## Per-agent launch prompt template

Give each agent its scope explicitly (don't rely on it discovering this file):

```
You are working in worktree .worktrees/<scope> on branch refactor/<scope>.
Read AGENTS.md and docs/ai/index.md first. Your ONLY editable paths: <paths>.
Do not touch files outside that set. Do not edit barrel index.ts in other packages.
This is a code-only refactor: run the CODE tier gate
(`bun run lint && bun run typecheck && bun run test`; add `bun run ai:tw` if you
changed Tailwind classes). Do NOT run ai:eval / context-layer checks. Report the
result. Do not merge.
```

## Role assignment by strength (suggested, not law)

- **Claude Code (Opus)** — architecture-heavy scopes (`packages/ui`,
  cross-surface design-system) or **verifier/coordinator** (runs `/code-review`
  on other agents' branches).
- **Codex CLI** — repo-scale mechanical refactors, unattended multi-file edits.
- **Gemini** — large-context sweeps, isolated self-contained scopes.
- **opencode** — swap models freely; use for cheaper/faster experimental scopes.
