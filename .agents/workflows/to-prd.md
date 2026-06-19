# To PRD

Turn the current conversation and repo evidence into a PRD. Do not interview the
user again unless a missing decision would make the PRD misleading.

## Process

1. Read `docs/ai/index.md`, `docs/ai/agent-behavior.md`, and
   `docs/ai/domain-language.md`.
2. Read the task route and conventions relevant to the proposed change.
   Persistent per-user data, schema changes, auth, RLS, keys, or Supabase access
   make the work R2; read `docs/ai/task-routes/r2-supabase.md` and
   `docs/conventions/supabase-security.md`.
3. Identify the highest useful module seams and test seams.
4. Draft the PRD in markdown. Do not publish to an external issue tracker unless
   the user explicitly asks.

## Template

```md
## Problem

## User-visible outcome

## Scope

## Data ownership

## Security / RLS impact

## Module seams

## Implementation decisions

## Testing decisions

## Out of scope
```

## Rules

- Use domain language from `docs/ai/domain-language.md`.
- Avoid specific code snippets and file paths unless they encode a durable
  decision more clearly than prose.
- Call out assumptions separately from decisions.
