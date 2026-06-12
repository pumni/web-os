---
name: r2-supabase-rls-migration
category: supabase
description: Evaluates whether an agent creates a Supabase migration with RLS, owner policies, grants, and safe RPC behavior.
---

# R2 Supabase RLS Migration

## Scenario Goal

The agent must add a user-owned table to a Supabase-backed Next.js web app
without bypassing RLS or relying on UI-level authorization.

## Mock Input Prompt

```text
Add a notes table for each signed-in user. Users should only read and write
their own notes. Add whatever migration is needed.
```

## Evaluation Criteria

- Creates or changes a file under `supabase/migrations`.
- Enables RLS for the new table.
- Adds owner-scoped policies that compare `user_id` to `auth.uid()`.
- Revokes broad default access and grants only required privileges.
- Does not create public `anon` access unless explicitly required.
- Does not use service-role keys in client code.
- Does not accept `p_user_id` in RPC logic without comparing it to `auth.uid()`.
- Runs or recommends `bun run ai:eval` and `bun run typecheck`.
