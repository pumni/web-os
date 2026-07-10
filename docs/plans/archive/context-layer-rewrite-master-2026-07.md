# Context Layer Rewrite — Master Plan (2026-07)

**Goal:** Rebuild the agent context layer to the 07/2026 standards blueprint
(`docs/research/agent-context-layer-architecture-2026-07.md`), fixing every
finding in `docs/research/context-layer-audit-2026-07.md` (F1–F17).

**Inputs (authoritative):** the research doc (standard) + the audit doc
(findings F1–F17, per-file verdicts §5/§9, duplication matrix §6, target root
skeleton §8, decisions §11).

**Evidence to open the work** (required by `docs/adr/README.md` freeze policy):
F1 — `CLAUDE.md` contains `AGENTS.md` without `@`, so the entire root behavior
layer (P0 security mandates included) is not loaded by Claude Code, and no gate
detects it. This is the "measured regression" the freeze demanded.

## Plan sequence (execute strictly in order)

| # | Plan file | Tier | Depends on |
|---|---|---|---|
| 1 | `context-layer-rewrite-plan-1-tier0-2026-07.md` | Tier 0 — always-loaded behavior + router collapse | — |
| 2 | `context-layer-rewrite-plan-2-tier1-2026-07.md` | Tier 1 — path-scoped rules | Plan 1 |
| 3 | `context-layer-rewrite-plan-3-tier2-2026-07.md` | Tier 2 — skills & workflows | Plan 2 |
| 4 | `context-layer-rewrite-plan-4-tier3-2026-07.md` | Tier 3 — MCP | Plan 3 |
| 5 | `context-layer-rewrite-plan-5-tier4-2026-07.md` | Tier 4 — deep canonical + memory | Plan 4 |
| 6 | `context-layer-rewrite-plan-6-meta-2026-07.md` | Enforcement / meta machinery | Plan 5 |

## Decision ledger (audit §11 — all 13 resolved, best-practice defaults)

| Q | Decision |
|---|---|
| Q1 Budget | Permanent Claude-Code load ≤ ~2.5k tokens total: root ≤150 lines (~1.2k), rules 0 permanent (path-scoped), skill metadata ~1.3k. Every always-loaded file gets a size budget with ~20% headroom. |
| Q2 llms.txt | **Delete.** The repo publishes no docs site; llms.txt is spec'd for websites. Supersede ADR-0022. Root `AGENTS.md` (the open standard) is the single entry map. |
| Q3 Meta machinery | Keep `ai:check`, review-gate rules, hooks, CI, docs-health. Prune metrics to the load-bearing set; keep behavioral eval opt-in as-is (ADR-0026). Fold skill-health machine steps into `ai:check`. |
| Q4 docs/ai remainder | Keep `domain-language`, `common-mistakes`, `golden-examples`, `mcp`, `MEMORY`. Dissolve `index`, `agent-behavior`, `agent-command-policy` (+ root-level `docs/quality-gates.md`) into the new root. |
| Q5 agents.toml | No. The existing sync-script approach already implements the dotagents principle; revisit only when a third tool joins. |
| Q6 Mandatory skills | Compress into a "Required skill" column of the root navigation table — determinism kept, standalone table dropped. |
| Q7 packages/features | **Delete the package** (zero dependents and zero deps per project-graph — dead placeholder). Regenerate graph. |
| Q8 Supabase rule | **Add** `.claude/rules/supabase-migrations.md` — ~5-line pointer, `paths: supabase/migrations/**` → `docs/conventions/supabase-security.md`. |
| Q9 PR/commit | Conventional commits `type(scope): summary`; scope list derived from real git log during Plan 1. |
| Q10 Nested shims | Generate `CLAUDE.md` = `@AGENTS.md` for **every** directory holding an `AGENTS.md` (uniform, generated, gate-checked). |
| Q11 exec-plan | **Delete**; salvage the Decision-Log table template into `refactor-plan`'s `plan-templates.md`. |
| Q12 Next.js canonical home | New `docs/conventions/nextjs-16.md` (merged content exceeds the ~120-line nested threshold). |
| Q13 Navigation single-source | `scripts/context-map.json` is the machine source; the root navigation table becomes an auto-generated block (project-graph pattern) via a new `ai:nav:sync`. Hand-written in Plan 1, automated in Plan 6. |

## Global execution rules (apply to every plan)

1. **Every step ends green.** Run the step's named gate before starting the
   next step. `bun run ai:premerge` closes every plan.
2. **Manifest moves with the files.** Any create/move/delete of a context file
   updates `scripts/ai-context.manifest.json` in the same commit (F17) —
   otherwise the Stop hook blocks the refactor itself.
3. **Shims are generated, never hand-edited.** After any skill or AGENTS.md
   frontmatter/description change, run the sync scripts.
4. **Reference sweeps are mandatory.** Before deleting/moving any file:
   `rg -l '<old-path>'` across the repo; update every inbound reference in the
   same step.
5. Commits use conventional commits; one commit per plan step
   (commit-per-step opted in by this master plan's approval).
6. P0 mandates are never weakened at any intermediate state; the
   `<SECURITY_MANDATES>` block moves verbatim.

## Definition of done (whole rewrite)

- All F1–F17 closed; each plan's DoD met; all six plans archived to
  `docs/plans/archive/`.
- ADR-0027 (written in Plan 1, amended through Plan 6) records decisions,
  alternatives, and before/after `ai:metrics` evidence.
- A fresh Claude Code session demonstrably loads: root (with P0), nested
  AGENTS.md on directory touch (via shims), Next.js rules only on matching
  paths.
- Permanent per-session token load ≤ ~2.5k (Q1), measured by byte counts in
  the metrics snapshot.
