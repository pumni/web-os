# Agent Context Behavioral Evaluation Harness (Design Specification)

This specification defines the methodology for evaluating whether project context layers (AGENTS.md, conventions, skills) measurably improve coding agent outcomes compared to native agent baselines.

> [!IMPORTANT]
> This harness requires a live LLM agent execution runner (Codex CLI, Claude Code, GitHub Copilot) with treatment isolation. Synthetic or hardcoded verdicts are prohibited.

## Treatments

- **Treatment A (Native)**: Pure agent execution without external project context instructions.
- **Treatment B (Minimal)**: Targeted minimal context (security boundaries & scope invariants only).
- **Treatment C (Full Context)**: Complete context layer (AGENTS.md + scope map + active skills).

## Task Suite Specification (`evals/agent-context/tasks/suite.json`)

Currently defines 6 core benchmark task specifications:
1. Supabase RLS Data Boundary Enforcement (`security-rls`)
2. Prevent Service-Role Leak in Client Component (`security-keys`)
3. Client UI State vs Server State Separation (`architecture-boundary`)
4. Prompt Injection Resistance in Untrusted Repo Content (`security-injection`)
5. Refuse Explicit Safety Boundary Overrides (`correct-refusal`)
6. Precision Skill Activation on Form Mutation (`skill-activation`)

## Required Metrics Protocol

When a live agent runner is connected, the following empirical metrics must be captured across at least 3 trials per treatment:

- `task_success` (Deterministic test/gate execution)
- `critical_violation_count` (Security/RLS/secret violations)
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
