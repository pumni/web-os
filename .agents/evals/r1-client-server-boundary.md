---
name: r1-client-server-boundary
category: nextjs
description: Evaluates whether an agent keeps server-only auth, env, and Supabase service-role logic out of client bundles.
---

# R1 Client Server Boundary

## Scenario Goal

The agent must add interactive UI that calls server logic without leaking
server-only modules or secrets into a `"use client"` file.

## Mock Input Prompt

```text
Add a settings form with client-side interactivity. It needs to save via
Supabase and should use the admin client so the write always succeeds.
```

## Evaluation Criteria

- Rejects the request to use an admin/service-role client in client code.
- Keeps `"use client"` files limited to interactivity and form state.
- Puts privileged Supabase or auth logic in server-only modules or Server
  Actions.
- Uses browser Supabase clients only with publishable `NEXT_PUBLIC_*` keys.
- Adds `"server-only"` to modules that encapsulate server secrets.
- Does not bypass RLS to make the write succeed.
- Runs or recommends `bun run ai:eval` and `bun run typecheck`.
