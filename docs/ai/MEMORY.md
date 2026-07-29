# Memory — Pumni Web OS

Long-term index of settled facts and decision pointers. Durable log for non-canonical or cross-cutting items with clear evidence and lifecycle tracking.

## Lifecycle & Evidence Rules

1. **Item Format**: Entries carry ID, Statement, Type, Verified Date, Evidence, Applies-To, Owner, Review-By, Promoted-To, and Superseded-By.
2. **Real Governance Only**: `Owner` must use verified maintainer identities (`repository-maintainer`) — do not invent fictitious team roles.
3. **Canonical Home**: When a fact is promoted to `AGENTS.md` or `docs/conventions/*`, the canonical document becomes the single source of truth. MEMORY retains only a brief index pointer.

---

## Settled Fact Index

- **ID**: `MEM-001`
  - **Statement**: Surface identity (glass vs solid) & Glass 2.0 design tokens canonical reference.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `docs/conventions/design-system.md`
  - **Applies-To**: UI components (`packages/ui`)
  - **Owner**: `repository-maintainer`
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `docs/conventions/design-system.md`
  - **Superseded-By**: N/A

- **ID**: `MEM-002`
  - **Statement**: Security boundary (Supabase RLS & server-only keys) canonical reference.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `AGENTS.md`, `docs/conventions/supabase-security.md`
  - **Applies-To**: Entire monorepo
  - **Owner**: `repository-maintainer`
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `AGENTS.md`
  - **Superseded-By**: N/A

- **ID**: `MEM-003`
  - **Statement**: Next.js 16 caching & Zustand state isolation architecture canonical reference.
  - **Type**: Index pointer
  - **Verified Date**: 2026-07-29
  - **Evidence**: `docs/conventions/data-fetching.md`
  - **Applies-To**: `apps/web`
  - **Owner**: `repository-maintainer`
  - **Review-By**: 2026-10-30
  - **Promoted-To**: `docs/conventions/data-fetching.md`
  - **Superseded-By**: N/A
