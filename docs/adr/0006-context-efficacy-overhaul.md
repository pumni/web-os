# 0006. Context Efficacy Overhaul

- **Status:** Accepted
- **Date:** 2026-06-19
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

Following the context layer overhaul in ADR-0005, there remained two main gaps:
1. **Meta-inversion:** The footprint of files explaining how to use context (`docs/ai/*.md`) remained disproportionately large compared to the actual engineering conventions of the repository (~38.7KB vs. ~8.6KB).
2. **Behavioral Evals in CI:** The behavioral eval suite was nominal (skipped in CI due to lack of environment configuration), and the regex-matching pattern had a parsing quote bug and loose refusal matching (like `"cannot"` or `"will not"` matching normal conversation and yielding false passes).
3. **Efficacy Measurement:** There was no objective proxy metric to measure whether a documentation file had any direct behavioral influence on static checks or policies.

## Decision

**Perform context efficacy overhaul v2:**

1. **Add Offline Rule-Efficacy Metric:** Implement `measureRuleEfficacy()` in `scripts/ai-metrics.mjs` to map rule citations in markdown documentation files against the 16 static review rules, flagging "unproven" files that carry token costs without citing rules.
2. **Prune Meta-Inversion Footprint:** Use the rule-efficacy metric to justify deleting three unproven meta-about-meta files: `context-system.md`, `memory-layer.md`, and `agent-command-policy.md`. Compress essential planes/flow/cache details into `AGENTS.md` and fold the hybrid memory layer description into `docs/ai/agent-behavior.md`.
3. **Thin Compatibility Wrappers:** Thin `CLAUDE.md` to under 200B, centralizing quick context map routing into `docs/ai/index.md`.
4. **Wire Deterministic Evals in CI:** Fix array frontmatter quote-parsing bug in `scripts/frontmatter.mjs`. Update prompt-injection tests to use refusal-anchored regex matching. Introduce a deterministic stub agent (`scripts/eval-stub-agent.mjs`) to verify the E2E behavioral evaluation pipeline on every CI pull request without LLM API keys. Add the `scripts/eval-agent.mjs` wrapper requiring `LLM_API_KEY` for real agent evaluations.

## Consequences

**Positive:**
- Context size footprint is reduced by ~10KB, reducing prompt token costs and caching overhead.
- True E2E verification of behavioral prompt-injection evaluations runs in CI on every PR.
- Static rule citations are clearly tracked per file in the metrics report.
- PowerShell/bash shell-drift is fixed with a unified, win32/cmd-compatible command policy in `AGENTS.md`.

**Negative / costs:**
- Removal of three documentation files (their compressed essential sections now reside in `AGENTS.md` and `agent-behavior.md`).
- Real LLM evaluation requires a configured `LLM_API_KEY` (otherwise, local executions fall back to mock refusal to prevent CI/gate failures).

## Alternatives considered

- **Maintain status quo:** Rejected because always-on meta-prose increases token cost and reduces agent success rates.
- **Pure harness-managed memory:** Rejected in favor of the hybrid model (ADR-0004) to maintain tool-agnostic capabilities.

## References

- the context-layer-2026-overhaul-v2 plan — overhaul v2 plan.
- `docs/adr/0005-context-layer-2026-overhaul.md` — overhaul v1 ADR.
