# File Migration Matrix

This is the initial inventory for the refactor. Re-resolve the current tree before editing because files may move between plan creation and implementation.

Legend:

- **KEEP** — retain architecture/purpose; minor cleanup allowed.
- **SLIM** — preserve the file but reduce duplicated/generic content.
- **REWRITE** — keep the concept but materially change content/ownership.
- **DELETE** — remove after migrating unique durable knowledge.
- **CREATE** — new artifact required by v3.
- **VERIFY** — validate current behavior before deciding whether changes are necessary.

| Path | Action | Target responsibility | Notes |
| --- | --- | --- | --- |
| `AGENTS.md` | SLIM | portable high-signal repo contract + JIT map | remove generic working heuristics; keep security and real cross-repo invariants |
| `CLAUDE.md` | KEEP | Claude discovery adapter | should remain a thin `@AGENTS.md` import if current Claude behavior requires it |
| nested `CLAUDE.md` | KEEP/VERIFY | scoped Claude discovery adapters | generated only; no policy bodies |
| `.github/copilot-instructions.md` | SLIM/KEEP | thin pointer | no independent doctrine |
| `apps/web/AGENTS.md` | SLIM | Next.js app-local delta | keep local structure/non-obvious framework decisions only |
| `apps/web/src/app/AGENTS.md` | SLIM | route-layer delta | keep route composition/build implications; avoid global security repetition |
| `apps/web/src/features/AGENTS.md` | SLIM | feature-slice delta | keep public API/server-client boundary not fully obvious from tooling |
| `apps/catalog/AGENTS.md` | SLIM | catalog operational delta | move long rationale to ADR pointer |
| `packages/ui/AGENTS.md` | SLIM | package purity/public API/local workflow | do not duplicate lint diagnostics/design manual |
| `packages/env/AGENTS.md` | SLIM/VERIFY | env-specific secret boundary | keep only package-local facts not already obvious from source/export map |
| `packages/auth/AGENTS.md` | SLIM | server-only auth package delta | dedupe root security/command lists |
| `packages/supabase/AGENTS.md` | SLIM | DB client package delta | keep generated types/client entry-point facts; dedupe security manual |
| `supabase/migrations/AGENTS.md` | SLIM | subtree activation + migration-local delta | detailed security doctrine moves to convention/skill/tests |
| `.agents/skills/supabase-migration/SKILL.md` | REWRITE | migration procedure + authoritative references | stop copying complete RLS/security rulebook |
| `.agents/skills/watch-sync/SKILL.md` | REWRITE | watch-sync workflow + references | source/tests become behavioral truth |
| `.claude/skills/**` | KEEP/REGENERATE | generated discovery pointers | never hand-maintain full skill bodies |
| `scripts/sync-claude-shims.mjs` | KEEP/VERIFY | deterministic adapter sync | simplify only if current discovery requirements allow it |
| `scripts/sync-skills.mjs` | KEEP/VERIFY | deterministic skill adapter sync | canonical skill stays under `.agents/skills` |
| `scripts/context-lint.mjs` | REWRITE/SLIM | context discovery structural integrity | remove hard 4096-byte failure; no semantic policy parser |
| `scripts/docs-lint.mjs` | CREATE | deterministic docs integrity | links/repo paths/commands/encoding with low false positives |
| `scripts/policy-check.mjs` | KEEP | focused static policy checks | do not broaden into generic architecture parser |
| `scripts/check-feature-boundary.mjs` | KEEP | characterize ESLint feature firewall | existing harness direction is good |
| `packages/config/eslint.mjs` | KEEP/VERIFY | mechanical import/design boundaries | remove prose elsewhere when reliable rules already own behavior |
| `docs/architecture/overview.md` | REWRITE/SLIM | architecture overview + correct mechanical owners | fix overclaim about `policy:check` proving package edges |
| `docs/conventions/nextjs-project-profile.md` | REWRITE/SLIM | project-specific Next.js decisions/pointers | exact version/config belongs to manifest/config source |
| `docs/conventions/data-fetching.md` | VERIFY/SLIM | project-specific state ownership | remove duplication if root/app instructions already cover it mechanically |
| `docs/conventions/testing.md` | VERIFY/SLIM | test strategy/location/command ownership | keep operationally useful distinctions; avoid generic testing advice |
| `docs/conventions/supabase-security.md` | REWRITE/SLIM | canonical durable Supabase security knowledge | name exact mechanical proof owners; remove duplicate workflow text |
| `docs/conventions/design-system.md` | REWRITE | design-system map/rationale/source ownership | stop being a giant lint rulebook; remove stale review dates/inventories |
| `docs/ai/common-mistakes.md` | DELETE | none | migrate unique concrete gotchas first; remove generic AI-mistake handbook |
| `docs/ai/mcp.md` | KEEP/VERIFY | narrow optional runtime-tool guidance | keep trust boundary and fallback; verify version pin/current need |
| `.mcp.json` | KEEP/VERIFY | optional Next.js runtime aid | exact pin should be source; remove only if no longer useful/trusted |
| `docs/adr/0026-llm-as-judge-behavioral-eval.md` | KEEP HISTORICAL | historical retired eval decision | do not reactivate regex/LLM scoring infrastructure |
| `docs/adr/0027-context-layer-v2-standards-alignment.md` | KEEP HISTORICAL | v2 rationale/history | supersede operational guidance with new ADR rather than editing history |
| new v3 ADR (expected `0030-*`) | CREATE | current context philosophy | choose next available ADR number at implementation time |
| `docs/plans/README.md` | UPDATE | active-plan discovery | link this handoff while active; remove/archive link when completed |
| `docs/plans/context-layer-v3/**` | KEEP TEMPORARILY | execution state/handoff | archive when full refactor is merged and stable |
| `.github/workflows/ci.yml` | UPDATE/VERIFY | canonical broad proof | ensure `verify` exercises new docs/context ownership |
| `.github/workflows/docs-health.yml` | VERIFY | external link health | keep network link rot separate from deterministic local docs lint |
| `package.json` | UPDATE | canonical command surface | add `docs:lint`; keep one broad `verify` command |

## Deletion rule

Before deleting any file, answer:

1. Does it contain unique project knowledge not represented elsewhere?
2. If yes, what is the correct canonical owner?
3. Can the knowledge be represented more faithfully by source/test/schema/type/lint?
4. Have all live references been updated?

Do not preserve a file just because deleting it feels risky. Preserve only unique durable value.

## Creation rule

Before creating any new context/doc/tool file, answer:

1. What exact ownership gap does it fill?
2. Why can the existing source/tests/docs not own that knowledge?
3. Is it persistent, scoped, JIT, procedural, historical, or executable?
4. How will it avoid becoming another source of truth that drifts?

If those questions do not have crisp answers, do not create the file.
