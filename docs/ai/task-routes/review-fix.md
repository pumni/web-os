---
description: Context budget for fixing review-gate, CI, lint, typecheck, test, or build findings.
when-to-load: When the prompt asks to fix a validation failure, review finding, or CI failure.
last-reviewed: 2026-06-19
---

# Review Fix Route

Use this route when the task starts from a failing command, review note, or CI
finding.

## Context Budget

Must read:

- `AGENTS.md`
- The failing command output or review finding
- The touched file and its nearest tests
- The canonical doc that owns the failing rule

May read:

- `docs/ai/common-mistakes.md` when an `ai:eval` rule fires.
- `.agents/workflows/review-gate.md` for manual checks.
- `docs/quality-gates.md` when deciding the final validation set.
- The matching R0/R1/R2 route if the fix changes scope.

Must not read by default:

- Unrelated feature modules
- Unrelated migrations
- React Native/mobile project docs

## Validation

First rerun the failing command. Then run the smallest broader gate that proves
no adjacent regression:

- Context failure: `bun run ai:check`
- Review static failure: `bun run ai:eval`
- Type failure: `bun run typecheck`
- Test failure: `bun run test`
- Bundle failure: `bun run build`

Do not hide a finding with an allowlist unless the false positive is understood
and documented with a specific reason.
