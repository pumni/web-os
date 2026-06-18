# 0005. Context Layer 2026 Overhaul

- **Status:** Accepted
- **Date:** 2026-06-19
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

The repository's AI context layer had become calcified with redundant, self-describing documentation (~14 files in `docs/ai/`), and manual ceremonies (such as handcrafted `last-reviewed` dates that were systematically bulk-stamped). The regression evaluation suite also consisted of redundant static file definitions that duplicated checks already covered by the static analyzer, while behavioral prompt-injection tests were unrunable specifications (`manual: true` without a runner).

We need a leaner context layer that optimizes prompt cache reuse, provides actual behavioral test execution, derives freshness from git history, and aligns with modern 2026-era agent execution guidelines.

## Decision

**Perform a major refactor (overhaul) of the context layer:**

1. **Remove ceremony docs:** Delete `model-routing.md` and `prompt-structure.md`. Incorporate essential instructions directly into `prompt-playbook.md`.
2. **Merge redundant system docs:** Combine `context-system-overview.md` and `context-maintenance.md` into docs/ai/context-system.md (under 5000 bytes).
3. **Automate freshness:** Remove `last-reviewed` frontmatter. Derive file freshness automatically via `git log -1 --format=%cI`.
4. **Behavioral Eval Runner:** Consolidate eval files by deleting 5 static rule descriptions (since they are already self-tested and static-checked). Change prompt-injection evals to `behavioral: true` and introduce a real, deterministic behavioral runner (`run-behavioral-evals.mjs`).
5. **Modernize memory:** Adopt a hybrid harness-managed memory model (ADR-0004).
6. **Trim redundant files:** Remove solo dev ceremony files (`.github/CODEOWNERS` and `.aiignore`).

## Consequences

**Positive:**
- Substantially lower context surface area (~9 files instead of ~14 in `docs/ai/`).
- True automated verification of prompt-injection vulnerability mitigations.
- Freshness tracking is now completely honest and derived automatically from git.
- Session memory is native and cache-efficient.

**Negative / costs:**
- Prompt-injection evals require a command interface config to execute (otherwise skipped).
- Historic plan documents must exclude checkDocPathReferences checks.

## Alternatives considered

- **Maintain status quo:** Rejected because manual checks are easily gamed and static description evals gave a false sense of test coverage.
- **Dismantle the enforcement plane:** Rejected. The deterministic static analyzer rules, manifest checks, and secrets scanning are crucial quality controls (the "crown jewel" of the context layer) and must be preserved.

## References

- `docs/plans/context-layer-2026-overhaul.md` — overhaul plan.
- `docs/adr/0004-memory-layer-harness-managed.md` — memory ADR.
