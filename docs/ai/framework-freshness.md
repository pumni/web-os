---
description: Stack-version freshness matrix for AI context rules that can drift as frameworks change.
when-to-load: Before editing stack-specific rules, upgrading dependencies, reviewing context drift, or writing code against a recently changed framework API.
---

# Framework Freshness Matrix

This repo favors version-matched local docs over model memory. For Next.js, the
installed package docs in `node_modules/next/dist/docs/` are the source of truth.
Use web docs only to compare against the broader current ecosystem.

## Verified Versions

Update this table when a tracked dependency changes or a verification date ages
past 180 days. `bun run ai:check` fails on version, source, or date drift.

| Package | Manifest | Version | Docs source | Verified |
| --- | --- | --- | --- | --- |
| `bun` | `package.json` | `1.3.14` | bun.sh/docs | `2026-06-19` |
| `turbo` | `package.json` | `2.9.18` | turborepo.com/docs | `2026-06-19` |
| `typescript` | `package.json` | `^5` | typescriptlang.org/docs | `2026-06-19` |
| `next` | `apps/web/package.json` | `16.2.9` | `node_modules/next/dist/docs/` | `2026-06-19` |
| `react` | `apps/web/package.json` | `19.2.4` | react.dev | `2026-06-19` |
| `react-dom` | `apps/web/package.json` | `19.2.4` | react.dev | `2026-06-19` |
| `babel-plugin-react-compiler` | `apps/web/package.json` | `^1.0.0` | react.dev | `2026-06-19` |
| `@tanstack/react-query` | `apps/web/package.json` | `^5.101.0` | tanstack.com/query | `2026-06-19` |
| `zustand` | `apps/web/package.json` | `^5.0.14` | zustand.docs.pmnd.rs | `2026-06-19` |
| `@supabase/supabase-js` | `apps/web/package.json` | `^2.108.1` | supabase.com/docs | `2026-06-19` |
| `@supabase/ssr` | `apps/web/package.json` | `^0.12.0` | supabase.com/docs | `2026-06-19` |
| `tailwindcss` | `apps/web/package.json` | `^4` | tailwindcss.com/docs | `2026-06-19` |
| `@tailwindcss/postcss` | `apps/web/package.json` | `^4` | tailwindcss.com/docs | `2026-06-19` |

## Installed Stack

| Stack | Installed version source | Context owner | Freshness rule |
| --- | --- | --- | --- |
| Next.js | `apps/web/package.json` (`next`) | `apps/web/AGENTS.md`, `docs/ai/mcp-runtime.md` | Read bundled docs before Next.js code, especially cache, request APIs, routing, images, and config. |
| React / React DOM | `apps/web/package.json` | `apps/web/AGENTS.md`, design/component docs | Verify React Compiler and new React APIs against official docs or Next bundled guidance before changing patterns. |
| TanStack Query | `apps/web/package.json` (`@tanstack/react-query`) | `docs/conventions/data-fetching.md`, `.agents/skills/tanstack-query-hook/SKILL.md` | Treat Query as client server-state only; verify API names before hook/mutation changes. |
| Zustand | `apps/web/package.json` (`zustand`) | `docs/conventions/data-fetching.md`, `.agents/skills/zustand-store/SKILL.md` | Keep stores to client UI state; do not mirror server data. |
| Supabase JS / SSR | `apps/web/package.json` | `docs/conventions/supabase-security.md`, `.agents/skills/supabase-migration/SKILL.md` | RLS, grants, policies, and key handling override UI assumptions. Verify auth/client APIs before edits. |
| Bun | Root `package.json` (`packageManager`) | `docs/ai/agent-command-policy.md`, `docs/quality-gates.md` | Use repo scripts as the stable interface; avoid relying on shell-specific behavior. |
| Turborepo | Root `package.json` (`turbo`) and `turbo.json` | `docs/architecture/overview.md`, `docs/quality-gates.md` | Treat `turbo.json` and package scripts as enforced config. |
| Tailwind CSS / design tokens | `apps/web/package.json`, `packages/ui` | `docs/conventions/design-system.md`, `.agents/skills/ui-styling/SKILL.md` | Use semantic tokens and `@pumni/ui`; raw color/token violations are enforced by `ai:check`. |

## Freshness Workflow

1. Identify whether the task touches a stack-sensitive API.
2. Read the context owner above and the relevant package/config file.
3. For Next.js work, read the matching bundled doc in
   `node_modules/next/dist/docs/` or use `nextjs_docs` through MCP.
4. For non-Next stack work, prefer official docs when the API or recommendation
   could have changed.
5. If docs and code disagree, follow P0/P1 from `AGENTS.md`, then local
   production evidence, and report the drift.

## Drift Signals

- A dependency version changes without a matching context update.
- A rule describes a removed experimental flag or deprecated API.
- A validation script passes but the framework docs now recommend a different
  primary API.
- A tool-specific wrapper repeats canonical policy instead of linking to it.
- Behavioral evals are reported as passed when the agent-backed run was skipped.

## Validation

- AI context updates: `bun run ai:check`
- Framework version drift: `bun run ai:freshness`
- Security, trust-boundary, or review behavior changes: `bun run ai:eval`
- Agent-backed prompt-injection behavior: `bun run ai:eval:behavioral`
- Local deterministic behavioral smoke: `bun run ai:eval:behavioral:stub`
