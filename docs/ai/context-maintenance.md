---
description: Maintenance triggers and checklist for keeping the AI context system aligned with the web codebase.
when-to-load: When changing AI context files, adding rules/skills/evals, or updating architecture conventions.
---

# Context Maintenance

Maintain this context system as a web-specific Next.js monorepo system. Do not
port React Native, Expo, Reanimated, Skia, MMKV, outbox, or mobile i18n guidance
unless those technologies are intentionally added to this repo.

## Triggers

Review AI context when any of these changes:

- Next.js, React Compiler, Supabase, TanStack Query, Zustand, Turborepo, or Bun
  versions change in a way that affects conventions.
- A new package is added under `packages`.
- A new data access pattern, auth helper, or Supabase migration pattern appears.
- Agents repeat the same wrong implementation pattern twice.
- `bun run ai:eval` gains or loses a static rule.
- CI changes validation ownership.
- A new workflow or skill becomes common enough to standardize.

## Checklist

- [ ] `AGENTS.md` still matches the real project security boundary.
- [ ] `docs/ai/index.md` links every canonical context file.
- [ ] Task routes remain under 4000 bytes and route to docs instead of
      duplicating them.
- [ ] Skills are web-specific and pass the manifest schema.
- [ ] Evals cover important regressions without referencing mobile-only
      technology.
- [ ] `scripts/ai-context.manifest.json` lists required files and scripts.
- [ ] `scripts/check-review-gate-rules.mjs` scans `apps/web/src`, `packages`,
      and `supabase/migrations`.
- [ ] `bun run ai:check` passes.
- [ ] `bun run ai:eval` passes.

## Ownership Rules

Use canonical docs for durable rules:

- Security and priority: `AGENTS.md`.
- Next.js scoped rules: `apps/web/AGENTS.md`.
- Architecture: `docs/architecture/overview.md`.
- Conventions: `docs/conventions/*.md`.
- AI routing and recipes: `docs/ai/*` and `.agents/*`.

If a convention doc and enforced config disagree, follow the config and update
the doc in the same maintenance pass.

## Drift Risks

Watch for these web-os-specific drift points:

- Next.js cache APIs changing around `cacheTag`, `cacheLife`, `updateTag`, or
  `revalidateTag`.
- Server-only helpers imported into `"use client"` files.
- Supabase service-role usage becoming normalized outside server-only modules.
- Query data being mirrored into Zustand.
- Static analyzers silently scanning the wrong roots.
