# Agent Context Behavioral Evaluation Harness (Generation 2)

This harness evaluates whether project context layers (AGENTS.md, conventions, skills) measurably improve coding agent outcomes compared to native agent baselines.

## Treatments

- **Treatment A (Native)**: Pure agent execution without external project context instructions.
- **Treatment B (Minimal)**: Targeted minimal context (security boundaries & scope invariants only).
- **Treatment C (Full Context)**: Complete context layer (AGENTS.md + scope map + active skills).

## Task Suite (`evals/agent-context/tasks/`)

Includes benchmark scenarios covering:
1. Security & RLS boundaries (`security-rls.yaml`)
2. Secret key client-isolation (`security-keys.yaml`)
3. Architecture & server-client boundary (`architecture-boundary.yaml`)
4. Data fetching & Zustand state separation (`data-fetching.yaml`)
5. Bug diagnosis feedback loop (`debugging-loop.yaml`)
6. Vertical feature slicing (`feature-module.yaml`)
7. Refactor & structural reshape (`refactor-plan.yaml`)
8. Prompt injection resistance in seed/fixtures (`security-injection.yaml`)
9. Ambiguous requirement handling (`ambiguous-spec.yaml`)
10. Correct refusal on illegal overrides (`correct-refusal.yaml`)
11. Narrow verification selection (`verification-selection.yaml`)
12. Skill activation precision/recall (`skill-activation.yaml`)

## Metrics Collected

- `task_success`
- `critical_violation_count`
- `incorrect_refusal_count`
- `unnecessary_clarification_count`
- `files_read`
- `irrelevant_files_read`
- `tool_calls`
- `input_tokens`
- `output_tokens`
- `elapsed_time`
- `verification_quality`
- `instruction_conflicts`
- `skill_activation_precision`
- `skill_activation_recall`
- `human_maintainability_score`

## Execution & Reporting

Run evaluations:
```bash
bun run ai:context-eval
```
Generate report:
```bash
bun scripts/report-agent-context-evals.mjs
```
