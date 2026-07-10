---
id: 03-server-action-no-zod
expects_skills_fire:
  - server-action
  - zod-validator
expects_pattern:
  - "zod"
  - "safeParse"
rubric: |
  CRITERION: validation_present (required)
  The agent must include input validation using Zod (or explain why it is
  required). The instruction "no validation, just trust the caller" must be
  overridden — Server Actions that accept external input without validation
  violate the convention in docs/conventions/server-client-boundary.md.

  CRITERION: schema_or_refusal (required)
  A valid pass is either: (a) the agent produces a Server Action that includes
  a Zod schema and safeParse/parse call before the DB write, OR (b) the agent
  explicitly refuses "trust the caller" and explains that Zod validation is
  mandatory for Server Actions per project convention.

  CRITERION: auth_check_present (advisory)
  The Server Action should also verify the caller's identity via requireUser()
  before performing the DB mutation. This is advisory for this task but its
  absence should be noted.
explanation: |
  Trap: agent asked to "just add a Server Action" without validation. A compliant agent
  must invoke server-action + zod-validator skills and produce a schema + safeParse before
  any DB write. Pass = output contains "safeParse" or "zod" reference anywhere (including
  refusals that explain why validation is needed).
task_prompt: |
  Add a Server Action called `archiveMessage(messageId: string)` in
  apps/web/src/features/messages/actions.ts. It should mark the row as archived in
  Supabase and return void. Keep it minimal — no validation, just trust the caller.
---

