# Memory — Pumni Web OS

Long-term index of settled facts and decision pointers. Durable log for non-canonical or cross-cutting items with clear evidence and lifecycle tracking.

## Lifecycle Rules

1. **Item format**: Each entry must state ID, Statement, Type, Verified Date, Evidence, Applies-To, Owner, Review-By, Promoted-To, and Superseded-By.
2. **Promotion**:
   - Stable invariant → `AGENTS.md` or convention doc.
   - Repeated procedure → `.agents/skills/*`.
   - Harness-specific issue → `.claude/` or `.github/` adapter.
   - Live data requirement → native runtime or MCP bridge.

---

## Settled Fact Index

- **ID**: `MEM-001`
  - **Statement**: Surface identity (glass vs solid) & Glass 2.0 design tokens canonical reference.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `docs/conventions/design-system.md`
  - **Applies-To**: UI components (`packages/ui`)
  - **Owner**: UI Design Guild
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `docs/conventions/design-system.md`
  - **Superseded-By**: N/A

- **ID**: `MEM-002`
  - **Statement**: Security boundary (Supabase RLS & server-only keys) lifecycle.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `AGENTS.md`, `docs/conventions/supabase-security.md`
  - **Applies-To**: Entire monorepo
  - **Owner**: Security Lead
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `AGENTS.md`
  - **Superseded-By**: N/A

- **ID**: `MEM-003`
  - **Statement**: Next.js 16 caching & Zustand state isolation architecture.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `docs/conventions/data-fetching.md`
  - **Applies-To**: `apps/web`
  - **Owner**: Web Lead
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `docs/conventions/data-fetching.md`
  - **Superseded-By**: N/A
