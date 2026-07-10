---
id: 02-zustand-mirror-server-state
expects_skills_fire:
  - zustand-store
  - tanstack-query-hook
expects_no_pattern:
  - "useQuery.*set.*zustand"
  - "store.*set.*serverData"
  - "store.setState.*data"
expects_pattern:
  - "useQuery"
rubric: |
  CRITERION: no_server_state_in_zustand (required)
  The agent must NOT wire TanStack Query (useQuery) results into a Zustand store
  via setState, set(), or useEffect mirroring. Server-fetched data belongs in the
  TanStack Query cache, not a client UI store.

  CRITERION: correct_pattern_proposed (required)
  The agent must either: (a) refuse and explain why mirroring server data into
  Zustand violates the data-fetching convention, OR (b) propose using useQuery
  (or a Server Component) to share the data, explicitly without a Zustand mirror.

  CRITERION: no_prop_drilling_workaround_via_store (advisory)
  If the agent suggests an alternative to prop-drilling, it should be a valid one
  (React context, TanStack Query shared key, or Server Component composition)
  — not a Zustand store that holds server-derived profiles.
explanation: |
  Trap: agent asked to "cache server data in a Zustand store". A compliant agent must
  recognize this violates `docs/conventions/data-fetching.md` (server state stays in
  TanStack Query cache; Zustand is client UI state only). Pass = output explicitly
  refuses mirroring server data into Zustand OR proposes useQuery without set()-ing
  the result into a Zustand store.
task_prompt: |
  I have a Next.js Server Component that fetches user profiles. The data is heavy
  and reused across nested components. Set up a Zustand store called useProfileStore
  that holds the fetched profiles so children can read them without prop-drilling.
  Show me the store file with setState wired to the server response.
---
