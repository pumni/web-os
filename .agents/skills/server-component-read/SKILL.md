---
name: server-component-read
description: Fetch request-scoped data in Server Components and queries.ts with Next 16 'use cache', parameterized cacheTag, and a safe cacheLife. Use when adding or changing a server read in features/<feature>/queries.ts, caching a Supabase read, or wrapping dynamic server data in Suspense.
---

# Server Component Read

Request-scoped reads belong in Server Components, not the client. This is the
server **read** seam: `server-action` owns writes, `tanstack-query-hook` owns
client-driven async. Use Next 16 Cache Components so reads are cacheable and
invalidated by tag, not refetched on every render.

## Rules

- Read `.claude/rules/nextjs-cache-components.md` and
  `docs/conventions/data-fetching.md` before adding a read.
- Put the read in `features/<feature>/queries.ts`; call it from a Server
  Component. Do not move database reads into client components to avoid prop
  drilling — pass server data down as props.
- Derive the user with `requireUser()` in the outer function, then pass `userId`
  into the cached function as an argument so the cache key includes it.
- `'use cache'` goes at the top of the function body that directly fetches —
  never inside a wrapper/HOF, where it silently becomes dynamic.
- ``cacheTag(`thing:${id}`)`` is always parameterized per user/resource; a
  generic tag collides across users. The tag string must match the `updateTag`/
  `revalidateTag` call in the mutating action exactly.
- `cacheLife` minimum is `'minutes'` (`'seconds'` breaks the PPR static shell);
  prefer `'hours'`/`'days'` for stable reference data.
- Project explicit columns (no `select('*')`) and handle the not-found path
  (`PGRST116`) explicitly instead of throwing on an expected empty row.
- A service-role client bypasses RLS: the `userId` filter must come from
  `requireUser()` and stay in the query. If the read can be RLS-scoped, prefer
  the request-scoped server client instead.
- Wrap dynamic server components in `<Suspense>` with a non-sensitive fallback;
  never render protected content in the fallback shell.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| A user sees another user's personal details or cached content | A generic cache tag was used, colliding across user sessions | Parameterize cache tags with user/resource context, e.g. `cacheTag("profile:" + userId)` rather than `cacheTag("profile")` |
| The page loses its static Shell (PPR) or renders slowly | The `'seconds'` profile was used in `cacheLife`, breaking PPR | Avoid `'seconds'` cache profile; use `'minutes'` as the absolute minimum safe profile |
| The cache is missed on every request, reloading database data | `'use cache'` was placed in a wrapper/HOF instead of the fetching body | Move the `'use cache'` directive directly into the body of the function executing the fetch |

## Checklist

- [ ] Read lives in `queries.ts` and is called from a Server Component.
- [ ] User derived via `requireUser()`; `userId` passed into the cached function.
- [ ] `'use cache'` is in the fetching function body, not a wrapper.
- [ ] `cacheTag` is parameterized; `cacheLife` is `'minutes'` or longer.
- [ ] Explicit column projection; not-found path handled.
- [ ] Service-role filter is server-derived, or an RLS-scoped client is used.
- [ ] Dynamic UI wrapped in `<Suspense>`; fallback leaks nothing protected.
- [ ] The mutating action's `updateTag`/`revalidateTag` uses the same tag string.
- [ ] `bun run typecheck` passes.
