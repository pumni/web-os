# Architecture Decision Records

This directory holds Architecture Decision Records (ADRs) for Pumni Web OS. An
ADR records **why** a non-obvious architectural decision was made — the "why"
that source code and conventions cannot carry on their own.

## Priority

ADRs sit at **P3** in the `AGENTS.md` priority stack (Architecture Decisions).
They rank below enforced config (P1) and architecture/conventions docs (P2), and
above local evidence (P4). An ADR explains a decision; it does not override a
gate. When a decision and an enforced config disagree, enforce the config and
update the ADR.

## When to write one

Write an ADR when a decision is:

- Hard to reverse (foundational package, data layer, auth boundary).
- Rejected an obvious alternative that future readers will re-propose.
- Establishes a convention that spans multiple packages or task routes.

Do **not** write one for trivial choices, naming, or anything already settled by
an enforced config or conventions doc.

## Format (MADR-lite)

Every ADR file is Markdown and starts with this header:

```
# NNNN. <Title>

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-0XXX
- **Date:** YYYY-MM-DD
- **Owner:** <role or team>
```

Followed by exactly four sections, in order:

1. **Context** — the problem, forces, and alternatives considered.
2. **Decision** — the choice made, stated concretely.
3. **Consequences** — positive, negative, and neutral effects; what we now must
   do or maintain.
4. **Alternatives considered** — what was rejected and why (prevents re-litigation).

## Lifecycle

- **Never delete an ADR.** Decisions evolve by changing status, not by removal.
- Status transitions only:
  `Proposed` → `Accepted` → `Deprecated` → `Superseded by ADR-0XXX`.
- To supersede, create a new ADR that references the old one by ID and update the
  old ADR's status line to point at the new one.

## Naming

`NNNN-kebab-title.md`, zero-padded to four digits, starting at `0001`. Numbers
are monotonic and never reused.

## Enforcement

ADRs are **not** in `scripts/ai-context.manifest.json`'s `requiredFiles` — they
have a different lifecycle (status transitions, never deleted) from the enforced
`docs/ai/*` set. However, any backtick reference to an existing ADR path (e.g.
`docs/adr/0001-structured-prompting-and-model-routing.md`) from an enforced doc
is validated by `checkDocPathReferences` in `bun run ai:check`, so a broken ADR
link still fails the gate.

## Index

- `0001-structured-prompting-and-model-routing.md` — added structured prompting
  (XML/`<thinking>`) and model routing guidance; declined wholesale adoption of
  the Enterprise AI Context blueprint.
- `0002-nextjs-cache-static-rules.md` — scoped the Next.js cache-API static
  rules to the two regex can catch cleanly; documented the two left for human
  review pending an AST-based analyzer.
- `0003-cursor-claude-settings-permissions.md` — deferred adoption of Cursor
  `.mdc` and Claude `settings.json` permission allow-deny; the glob-scoped
  `.claude/rules/` layer + static analyzer cover the observed surface, with an
  explicit re-open trigger.
- `0004-memory-layer-harness-managed.md` — adopted a hybrid memory model using harness-managed session memory as primary and MEMORY.md as durable long-term storage.
- `0005-context-layer-2026-overhaul.md` — performed a comprehensive refactoring of the AI context layer to trim ceremony, automate freshness tracking, introduce behavioral prompt-injection evaluations, and consolidate core documentation.
- `0006-context-efficacy-overhaul.md` — introduced a static rule-efficacy metric, pruned unproven meta-about-meta files, thinned CLAUDE.md wrapper, and wired behavioral evaluations in CI via a deterministic stub agent.
- `0007-context-efficiency-2026.md` — split design-system reference detail into a UI styling skill, merged risk guidance into agent-behavior, and added package-scoped AGENTS.md coverage for all packages.
- `0008-refined-command-policy.md` — refined AI command execution instructions to align with harness host shell constraints (variable expansion, operator support) and resolved the internal `&&` contradiction. (Renumbered from a duplicate `0007`.)
- `0009-context-layer-lean-2026.md` — cut the hand-rolled routing/operating-manual layer and behavioral-eval/meta-metric machinery; kept tool-agnostic `.agents/` skills with a single-file router; fixed validation altitude (code gates vs context gates). Supersedes the meta-process portions of 0005/0006/0007.
- `0010-frontend-platform-foundation.md` — reframed `@pumni/ui` as a reusable
  OS skeleton; locked a brand-contract token layer, an inverse-APCA foreground
  generator, and a granular `exports` map; declined Style Dictionary, Storybook,
  RTL, and a premature package split as enterprise tax for the current context.
- `0011-watch-sync-state-machine-and-observability-seam.md` — made the watch
  playback-sync lifecycle an explicit pure reducer (states/events/effects) and
  added a vendor-neutral, no-op observability seam fed from the machine's
  transitions; declined XState and a direct vendor SDK / `@pumni/observability`
  split as premature.
- `0012-engineered-glass-surface-language.md` — moved the `@pumni/ui` glass
  identity from iOS frosted vibrancy to engineered dark-glass (thin neutral
  fill + bright-top/dark-bottom rim pair + tokenized `--glass-saturate` +
  directional shadow), gave solid cards real elevation (`surface-raised`), and
  de-Appled the OS window chrome (neutral controls); kept the OS shell
  presentational and the APCA gate authoritative.
- `0013-card-composition-primitives.md` — unified the card consumption layer
  (three parallel systems + 43 ad-hoc surfaces) behind a composition-first set:
  `Card` stays the block surface; `CardWell` (inset well), `Badge` (status
  pill), and `IconBadge` (icon chip) replace hand-rolled copies; `BentoGridItem`
  became layout-only; extended `pumniNoAdHocSurface` to block the shorthand
  `border bg-muted` well. Declined a competing `Surface` primitive.
- `0014-glassmorphism-surface-treatment.md` — amended the glass *visual
  treatment* of ADR-0012 toward modern glassmorphism (landed 2026-06-20,
  amended 2026-06-21 by ADR-0016): vibrancy (`--glass-saturate` 1.4) + a
  luminous edge pair (`--surface-rim-top` / `--glass-shadow-edge`, top rim
  unified with solid by [ADR-0018](0018-unify-surface-rim-top.md)) +
  volumetric rim pair on `glass-panel`/`glass-window`, all layered so the
  APCA gate still reads single fill/border colours. 5-element model (sheen
  removed by ADR-0016). Perf discipline: `will-change` scoped to overlay
  transitions, stacked glass capped at 2 layers (doc/skill rule).
  Blur 8–16px (dark 16px). Drift guards: `glass-rim`, `glass-performance`.
- `0015-glass-card-backdrop-requirement.md` — supplemented ADR-0014 with the
  usage precondition glass needs to read at all: a `Card variant="glass"` (or
  `glass-panel`) must float over a colourful backdrop (OS desktop blobs, media,
  or the `showcase.tsx` 2-blob wrapper), otherwise it must be a `variant="solid"`
  card. Banned glass for dense content (forms, long text, tables) and flat
  backgrounds. No token/value/API change — supplements ADR-0014, does not amend
  it. Migrated the three production sites that violated the rule; promoted
  `/design-trends` to the gold-reference teaching page.
- `0016-glass-sheen-removal-and-dark-blur-tune.md` — amended ADR-0014's visual
  treatment: removed the inner diagonal sheen (`--glass-sheen`, not part of the
  canonical 5-element glassmorphism formula) + nested-glass CSS soft-guard + 2
  a11y resets + drift-guard test; tuned dark-mode blur 12→16px. 5-element model
  (tint / blur+saturate / edge pair / shadow / fallback). No public API change.
  Code gate: lint/typecheck/test all green (282/282 pass).
- `0017-bento-container-query-and-subgrid-deferral.md` — made `BentoGrid` a
  named container (`@container/bento`) so it collapses 1→6→12 by its own width
  (fixes sidebar/dialog/Window crushing) with `@[…]/bento:` tier spans that stay
  in sync via the named container; deferred subgrid (large `Card` refactor,
  small cosmetic win). Thresholds match legacy `sm`/`lg` so full-width
  consumers render identically.
- `0018-unify-surface-rim-top.md` — unified the "lit top rim" concept (the 1px
  specular inset-top edge) from two drifted tokens — `--glass-highlight` (glass)
  and `--card-rim-top` (solid) — into one surface-agnostic `--surface-rim-top`
  (light 0.5 / dark 0.2). `surface-raised` and every `glass-*` utility now read
  the same token; dark-mode solid cards gain a visible rim (0.05 → 0.2). Bottom
  rim (`--glass-shadow-edge`) stays glass-only. Drift guard `glass-rim` updated.
  **Amended by [ADR-0020](0020-solid-cards-drop-specular-rim.md):** the solid
  half of the seam was dropped — `surface-raised` is structural-only; glass
  keeps the rim.
- `0019-border-consumption-flow.md` — canonized the border-consumption decision
  tree: "border" is three concepts (structural hairline / specular rim / status
  tint) with exactly three hairline tokens (`--border` dark, `--input` dark,
  `--glass-edge` white) plus the ADR-0018 shared `--surface-rim-top` seam; status
  tint `/20` only via `Badge` / `Card state`. Added the `border-consumption` CSS
  drift guard so the solid-vs-glass hairline separation cannot cross silently.
- `0020-solid-cards-drop-specular-rim.md` — dropped the specular top rim
  (`--surface-rim-top`) from `surface-raised` so solid cards are structural-only
  (`--border` + `--shadow-card-raised`, no inset highlight), matching the
  ADR-0019 contract ("solid = structural only"). Amends the solid half of
  ADR-0018's shared seam; the glass half (all 8 `glass-*` utilities) is
  unchanged and the token stays defined as glass-owned. Inverts the
  `border-consumption` guard's solid-rim assertion.
