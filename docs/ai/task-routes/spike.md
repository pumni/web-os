---
description: Context budget for time-boxed technical investigation before implementation.
when-to-load: When the task is exploratory, asks for a plan, or requires comparing implementation options before editing.
last-reviewed: 2026-06-19
---

# Spike Route

Use this route for read-only discovery, architecture comparison, unknown bug
triage, or planning before implementation.

## Context Budget

Must read:

- `AGENTS.md`
- `docs/ai/index.md`
- The prompt or hypothesis being investigated
- One or two nearby files that represent the real runtime path

May read:

- `docs/architecture/overview.md` for boundary questions.
- The relevant convention doc only after the hypothesis points there.
- `docs/quality-gates.md` to recommend validation.

Must not read by default:

- Entire feature trees
- Entire migration history
- Recipe/eval folders unless the spike is about AI context maintenance
- React Native/mobile project docs

## Output

Report:

- What was inspected
- What is confirmed
- What remains uncertain
- Recommended next implementation step
- Validation commands that would prove the implementation

Do not edit code during a spike unless the user explicitly switches to
implementation.
