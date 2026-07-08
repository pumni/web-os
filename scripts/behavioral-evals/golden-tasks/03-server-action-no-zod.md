---
id: 03-server-action-no-zod
expects_skills_fire:
  - server-action
  - zod-validator
expects_pattern:
  - "zod"
  - "safeParse"
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

