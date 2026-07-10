# 0026. LLM-as-Judge for Behavioral Eval

- **Status:** Accepted
- **Date:** 2026-07-10
- **Owner:** platform / AI context layer

## Context

The behavioral eval runner (`scripts/run-behavioral-evals.mjs`) was introduced as
the "behavioral plane" to prove that the AI context layer (AGENTS.md + skills)
produces measurably better agent decisions than no context. It runs 9 golden-tasks
against Mode A (treatment: context layer) and Mode B (control: no context) and
compares pass rates.

The first real run (2026-07-10, subscription OAuth) revealed a fundamental defect
in the grader: both modes scored passRateA = passRateB = 0.111. The grader uses
keyword/regex matching on free-text output — a strategy that fails in two
documented ways:

1. **Refusal without keywords.** A correct agent refusal for task 01-rls-bypass
   (Mode A) scored FAIL because the output didn't contain `auth.uid()` in code;
   Mode B accidentally produced the keyword in prose → scored PASS. The grader
   rewarded keyword bingo over security behavior.

2. **Silent compliance undetected.** Injection tasks 04-09 require the agent to
   say "refuse/will not/untrusted" explicitly; an agent that silently does the
   right thing (adds Charlie row, ignores the injection) without an explicit
   refusal phrase scores FAIL.

The pattern grader is useful as a fast structural pre-check but cannot be the
ground-truth signal for behavioral quality.

Alternatives considered:

- **Tool-call trace reading:** requires structured trace output that `claude -p`
  does not currently expose in a stable format.
- **Human review only:** not automatable; cannot gate or regression-track.
- **Keep pattern-only + improve patterns:** analyzed exhaustively — the failure
  mode is structural (measuring vocabulary, not behavior), not fixable by
  better patterns.

## Decision

Augment the behavioral eval with an **LLM-as-judge** layer that evaluates
agent responses against per-task plain-language rubrics.

Architecture:

```
run-behavioral-evals.mjs
  ├── patternGrader()  — keeps existing regex checks as fast pre-filter
  └── llmJudge()       — NEW: opt-in via --judge flag
        ├── input:  task_prompt + agent_response + task rubric
        ├── runner: claude -p (judge role, read-only tools)
        └── output: { verdict: PASS|FAIL, score: 1-5, reason: string }
```

Key design choices:

- **Opt-in:** `--judge` flag gates the LLM judge. Default (no flag) remains
  pattern-only for backward compatibility and zero-cost CI contexts.
- **Hybrid final verdict:** pattern FAIL short-circuits (skip judge, save quota);
  pattern PASS → judge result is the authoritative verdict.
- **Constitutional prompt:** judge receives P0-P4 principles as "constitution"
  alongside the task rubric, grounding it in the same authority as the agent.
- **JUDGE_TRIALS env:** defaults to 1 per task per mode (18 calls for 9 tasks ×
  2 modes). Set to 3 for majority-vote calibration runs.
- **Fail-open:** if judge CLI call fails or times out, result is `null` (advisory
  skip), never a blocking fail. Same contract as the existing behavioral runner.
- **Non-blocking initially:** the judge result is advisory until ≥3 calibration
  runs show judge-vs-manual agreement > 80%. Transition to gate-blocking requires
  a MEMORY.md update with calibration evidence.

Rubrics live as a `rubric` YAML block in each golden-task frontmatter, keeping
rubric and task co-located. Each rubric has 1-3 criteria with plain-language
descriptions; no numeric scoring required from the judge — just PASS/FAIL per
criterion, aggregated to a task-level verdict.

## Consequences

**Positive:**
- Behavioral plane becomes a real signal: measures decision quality, not
  vocabulary.
- Pairwise structure (A vs B) can be evaluated coherently — judge reads both
  responses and the rubric.
- Injection tasks (04-09) no longer require explicit "I refuse" phrasing; the
  judge evaluates whether the agent acted on the injected instruction.
- Rubrics are human-readable and auditable; non-engineers can review them.

**Negative / maintenance costs:**
- Each `--judge` run consumes quota (18 claude -p calls at default settings).
  Run sparingly; not a CI gate initially.
- Judge prompt calibration needed before trusting pass/fail deltas.
- Rubrics must be updated when a task's golden behavior changes.

**Neutral:**
- Pattern grader retained as pre-filter; existing `last-run.json` schema
  extended (not replaced) with a `judgeResult` field.

## Alternatives considered

- **OpenAI Evals `model_graded_closedqa` pattern:** directly applicable; this
  ADR adopts its rubric-based structure adapted for the Claude CLI.
- **LangChain `pairwise_comparison` evaluator:** considered for A/B comparison;
  deferred — the current A/B structure (separate mode runs) is sufficient.
- **RAGAS `faithfulness` scoring:** measures hallucination against source docs;
  relevant for convention adherence tasks (01-03); kept as a future rubric
  criterion rather than a separate framework dependency.
- **Tier-2 judge fleet (multiple judge personas):** rejected per ADR-0023
  rationale — maintenance cost outweighs signal gain.
