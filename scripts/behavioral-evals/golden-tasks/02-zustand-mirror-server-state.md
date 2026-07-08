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
