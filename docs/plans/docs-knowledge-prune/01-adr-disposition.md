# ADR Disposition

## Acceptance rule for an ADR

An ADR stays in the working tree only when all of the following are true:

1. the decision is still active;
2. it affects architecture/product/security/operations beyond one implementation detail;
3. reversing it would be expensive or would reopen a meaningful trade-off;
4. the rationale is not obvious from current source/config/tests alone;
5. the document can be made factually current without becoming an implementation inventory;
6. another surviving ADR does not already subsume the same decision.

Deprecated/superseded decisions normally leave the working tree after their durable outcome is captured by the current replacement. Git history is the historical record.

## Current ADR inventory and disposition

| ADR | Current role | Disposition | Required action |
|---|---|---|---|
| `0002-nextjs-cache-static-rules.md` | Framework/cache-policy cleanup history plus volatile API details | **DELETE** | Preserve only genuinely project-specific cache invariants in current Next.js/data conventions or focused tests. The durable "use framework-native owners, not a private parser" principle is already covered by Context Layer v3. |
| `0003-cursor-claude-settings-permissions.md` | Negative decision not to add vendor-native permission policy | **DELETE** | Absence of an unneeded vendor policy does not require a permanent ADR. Context Layer v3 already establishes portable guidance and thin adapters. Reintroduce a new decision only after a real failure justifies it. |
| `0010-frontend-platform-foundation.md` | Important UI-platform rationale, but very large, heavily amended, and contains stale implementation snapshots/references | **SUPERSEDE + DELETE** | Create compact `0031-ui-platform-contract.md` containing only the durable current contract. Update current references to 0031, then remove 0010 from the working tree. |
| `0011-watch-sync-state-machine-and-observability-seam.md` | Load-bearing watch-sync architecture still used by the watch skill | **KEEP + COMPACT** | Retain the pure decision core/effect boundary/transition-derived telemetry rationale. Remove pre-refactor variable inventories, line-number snapshots, exhaustive event lists, and speculative packaging/vendor discussion unless still necessary to understand the trade-off. |
| `0021-revisit-platform-rejections.md` | Storybook/DTCG revision to 0010 | **MERGE INTO 0031 + DELETE** | Preserve current facts only: catalog is an isolated non-default-gating preview surface; CSS is token SSOT; DTCG is generated downstream. Do not preserve the old "rejection reopened" narrative after 0031 exists. |
| `0022-keep-llms-txt-agentic-handshake.md` | Superseded context-history record | **DELETE** | No current decision is unique here. Git history preserves traceability. |
| `0025-css-native-color-pipeline-modernization.md` | Implementation-level token resolver/CSS syntax choice | **DELETE** | Source/tests own parser behavior and supported syntax. Keep only durable design-system principles in `design-system.md`; do not maintain an ADR for parser implementation mechanics. |
| `0026-llm-as-judge-behavioral-eval.md` | Deprecated evaluation experiment | **DELETE** | ADR-0030 already captures the current decision against uncalibrated LLM-as-judge CI. Historical experiment detail belongs in Git history. |
| `0027-context-layer-v2-standards-alignment.md` | Earlier context architecture substantially subsumed by ADR-0030 | **FOLD INTO 0030 + DELETE** | Make 0030 self-contained and remove live references that require 0027. Keep only unique current principles if any are found during diff review. |
| `0028-polar-billing-personal-tenancy.md` | Durable provider/tenancy/entitlement architecture | **KEEP + COMPACT + VERIFY** | Verify Polar, personal tenancy, provider discriminator, and server/database entitlement ownership against current schema/code. Remove volatile tier/price/quota implementation detail if source/config is the stronger owner. |
| `0029-inngest-durable-webhook-processing.md` | Durable webhook processing/reconciliation architecture | **KEEP + COMPACT + VERIFY** | Verify async Inngest path, signature/idempotency boundary, fallback, and reconciliation from current source/tests. Remove exact cron/retry/hosting assumptions unless they are the durable decision. |
| `0030-context-layer-v3-agent-judgment.md` | Current context-system architecture | **KEEP + MAKE SELF-CONTAINED** | Remove dependency on ADR-0027 as a live prerequisite. Preserve portable AGENTS, JIT references, mechanical owners, thin provider adapters, and optional task-level context isolation. |

## New ADR: `0031-ui-platform-contract.md`

Create one compact replacement for the durable parts of ADR-0010 and ADR-0021.

### Required durable decisions

Include only decisions verified against current source:

- `@pumni/ui` is a reusable, client-safe UI/platform package rather than product-domain code;
- public consumption is through explicit subpath exports; there is no root barrel contract;
- CSS/token sources under `packages/ui/src/styles/` are the human-edited design-token source of truth;
- the brand contract is an explicit consumer override surface rather than requiring edits to core semantic tokens;
- generated DTCG output is downstream of CSS rather than a competing authoring source;
- the catalog is an isolated visual/component review surface and is intentionally outside the canonical default repository verify obligation unless that policy has changed;
- APCA remains the engineering contrast target if current design-system tests/source still confirm it; compliance-reporting bridges must not be described as the primary engineering gate.

### Do not copy into 0031

Do not carry forward:

- historical enterprise-blueprint comparisons;
- exact dependency/framework version snapshots;
- counts of import sites;
- old decisions to keep a root barrel followed by amendments removing it;
- Storybook/Ladle spike narration;
- detailed function names that source can reveal;
- Figma/RTL speculation unless an active project requirement now makes it load-bearing;
- old references to missing ADR numbers.

Target: a small rationale document, not a platform history book.

## Known reference migrations

Before deleting 0010/0021/0027, search the entire repository and update current references. Known current or likely references include:

- `docs/README.md` → Context Layer v3 (`ADR-0030`), not v2;
- `docs/architecture/overview.md` → UI platform contract `ADR-0031`;
- `docs/conventions/design-system.md` → `ADR-0031`;
- `apps/catalog/AGENTS.md` and `apps/catalog/README.md` → `ADR-0031` for catalog policy;
- `apps/web/src/shared/lib/observability/telemetry.tsx` and watch ADR references → remove dependency on ADR-0010 unless a current architectural rationale still requires the replacement 0031;
- package/source comments that cite deleted ADRs → either point to the surviving ADR or, if the comment is obvious from code, remove the ADR citation entirely.

Run repository-wide searches for every deleted ADR number; do not rely only on this known list.

## Expected final ADR set

Unless current source produces a concrete reason to retain another decision, the target set is:

```text
docs/adr/README.md
docs/adr/0011-watch-sync-state-machine-and-observability-seam.md
docs/adr/0028-polar-billing-personal-tenancy.md
docs/adr/0029-inngest-durable-webhook-processing.md
docs/adr/0030-context-layer-v3-agent-judgment.md
docs/adr/0031-ui-platform-contract.md
```

The numeric gaps are intentional. Deleted ADR numbers remain retired in Git history and must never be reused.
