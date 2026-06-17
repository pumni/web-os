# Memory — Pumni Web OS

Long-term index of settled facts that are not yet (or not best) captured in a
canonical doc. Start here on long or resumed tasks. Keep entries short and
pointers-first. See `docs/ai/memory-layer.md` for the compaction workflow.

## How to use

- Read this at the start of a long task alongside `docs/ai/index.md`.
- Add an entry only when a decision is **settled** and does not belong in a
  canonical doc yet.
- When an entry becomes a durable rule, promote it into the right
  `docs/conventions/*` or `docs/architecture/*` file and remove it here.

## Settled facts

- **Security boundary is RLS, not UI.** Service-role/secret Supabase keys are
  server-only; browser code uses `NEXT_PUBLIC_*` only. Owner: `AGENTS.md`,
  `docs/conventions/supabase-security.md`.
- **State ownership.** Server state stays in Server Components / TanStack Query;
  Zustand holds client UI state only. Owner: `docs/conventions/data-fetching.md`.
- **Next.js 16 cache API.** Use `cacheTag`/`cacheLife`/`updateTag`; the
  single-argument `revalidateTag(tag)` is invalid. Owner:
  `docs/conventions/data-fetching.md`, `docs/ai/common-mistakes.md` §10.
- **Build is green without `transpilePackages`.** Turbopack resolves workspace
  symlinks; add `transpilePackages` only if a build/type error proves it is
  needed. Owner: `docs/conventions/transpile-packages.md`.
- **MCP runtime is optional.** `next-devtools-mcp` (`.mcp.json`) is a local dev
  aid; never depend on it for CI or gates. Owner: `docs/ai/mcp-runtime.md`.

## Decisions log

<!-- Append one-line settled decisions here: YYYY-MM-DD — decision — owner doc. -->
