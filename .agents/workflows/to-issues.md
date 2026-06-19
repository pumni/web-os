# To Issues

Break a PRD, plan, or approved design into independently verifiable vertical
slices. Default output is markdown issue drafts in the conversation, not
external issue tracker writes.

## Process

1. Read the source PRD/plan and `docs/ai/domain-language.md`.
2. Explore the current code only as needed to understand existing seams and
   blockers.
3. Draft slices that cut through all required layers for one narrow behavior.
4. Present the breakdown for approval before writing files or publishing issues.

## Slice Shape

Each slice should include:

- **Title**: short domain-language title.
- **What to build**: end-to-end behavior, not layer-by-layer chores.
- **Acceptance criteria**: observable outcomes.
- **Blocked by**: dependencies, or "None".
- **Security / RLS impact**: required for persisted user data, auth, keys, or
  Supabase changes; otherwise "None".
- **State ownership**: where server state and client UI state live.
- **Validation**: commands or checks that prove the slice.

## Rules

- Do not create horizontal slices such as "schema only", "API only", or "UI
  only" unless the slice is explicitly a prefactoring step that makes later
  vertical work safer.
- Each completed slice should be demoable or verifiable on its own.
- Slices touching persisted per-user data must name RLS/security impact and
  state ownership explicitly.
- Do not modify or close parent issues unless the user explicitly asks.
