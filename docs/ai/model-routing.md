---
description: Advisory guidance on which model class fits which task type. Operational only — the repo never picks a model for you, and routing never overrides validation.
when-to-load: When choosing or switching models for a class of task, or when a task feels mismatched to the model running it.
last-reviewed: 2026-06-19
---

# Model Routing

Operational guidance, **not** repo config. This file does not select a model for
you, does not pin anything, and does not edit `.mcp.json` or CI. It only helps
reason about which *class* of model fits which *class* of task in this codebase.

## Priority

Model routing is **P6 (task intent)** in the `AGENTS.md` priority stack. It
cannot override P0–P4. Three rules hold regardless of model:

1. `bun run ai:check` and `bun run ai:eval` always run. No model is "too weak"
   to skip validation, and none is "strong enough" to skip it.
2. RLS stays default-deny, the service-role key stays server-only, and
   `"server-only"` stays on server modules. A model choice never relaxes P0.
3. If a model's suggestion conflicts with enforced config (P1) or architecture
   (P2), enforced config wins. Report the drift; do not work around it.

## Task-type → model-class guidance

Use this as a tie-breaker when you can choose. Where you cannot, fall back to the
default model and lean harder on the validation gates.

| Task type | Characteristics | Model class that fits |
| --- | --- | --- |
| Architecture, App Router, Cache Components boundaries | Long context, subtle invariants, async/cache pitfalls (`apps/web/AGENTS.md`) | Strong reasoning, large context window |
| R2 Supabase / RLS / auth / keys | Security-critical, multi-constraint | Strong reasoning; use `docs/ai/prompt-structure.md` XML tagging |
| CI / debug-log analysis, large refactor, batch test generation | Parallel tool use, throughput, discipline over depth | Tool-discipline / high-throughput |
| Sensitive data, privacy-constrained, must not leave environment | Local or self-hosted inference | Local / on-prem |
| Most R0 and R1 | Balanced | Default model |

## How to use it

- **Default first.** Run the default model on R0/R1. Only switch when a task
  clearly matches a row above and the default is struggling.
- **Structure > switch.** For R2 and multi-package work, applying
  `docs/ai/prompt-structure.md` (XML tags + `<thinking>`) usually helps more
  than switching models. Do both only when needed.
- **Verify after every switch.** Treat a model change like any other change:
  re-run the validation gate for the task's route
  (`docs/ai/task-routes/*.md`). A different model can produce different
  mistakes; the gates catch them deterministically.
- **Never use model choice as a reason to bypass a gate.** If a gate fails, the
  fix is the code or the prompt, not the model.

## What this file does not do

- It does not recommend a vendor or a specific model name. Model offerings
  change faster than docs do; keep this at the class level.
- It does not change CI. `.github/workflows/ci.yml` runs `ai:check` + `ai:eval`
  on every push regardless of which model produced the code.
- It does not justify skipping type safety, RLS, or any P0–P4 rule.

See `docs/ai/prompt-playbook.md` for risk classification (R0/R1/R2), and
`docs/ai/prompt-structure.md` for how to structure hard prompts.
