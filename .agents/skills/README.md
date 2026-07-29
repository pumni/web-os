# Pumni Agent Skills Architecture

Project skills under `.agents/skills/` package specialized domain procedures, reference tables, and verification steps.

## Layout Standard

- Canonical skills live in `.agents/skills/<skill-name>/SKILL.md`.
- Thin shims at `.claude/skills/<skill-name>/SKILL.md` enable Claude Code discovery and are synced automatically with `bun run ai:skills:sync`.
- Every skill requires valid YAML frontmatter (`name`, `description`) and clear completion criteria.

## Active Skill Inventory (5 Core Skills)

1. **`web-feature`**: Vertical feature slice scaffolding, Server Actions, queries, forms, Zod validators, and Zustand UI state.
2. **`supabase-migration`**: Schema changes, Row Level Security (RLS) policies, and RPC hardening.
3. **`ui-system`**: Design system tokens, surface roles (glass vs solid), OKLCH contrast rules, and `@pumni/ui` primitives.
4. **`watch-sync`**: Playback sync state machine, timing math, and broadcast sync architecture.
5. **`dependency-update`**: Dependency bumps via the root Bun catalog and gate verification.

## Activation Policy

Skill activation is outcome-based. Use a relevant skill when its specialized process or references reduce uncertainty. Native agent workflows are acceptable when they satisfy the same project invariants and verification criteria.
