# 0031. UI Platform Contract

- **Status:** Accepted
- **Date:** 2026-08-21
- **Owner:** UI platform / frontend
- **Supersedes:** ADR-0010, ADR-0021

## Context

`@pumni/ui` is shared by the web app and an isolated visual catalog. The
package needs a stable public boundary, one token authoring source, and a
review surface that does not become a second product application or a second
design-token system.

## Decision

1. `@pumni/ui` is a reusable, client-safe UI platform package. It has no auth,
   database, or product-domain dependencies.
2. Consumers use explicit subpath exports. There is no root barrel contract;
   the package export map is the public API.
3. Human-authored CSS under `packages/ui/src/styles/` is the design-token
   source of truth. The brand contract is the explicit consumer override
   surface; consumers do not edit platform semantic tokens to rebrand.
4. DTCG output is generated downstream from CSS and is not a competing
   authoring source. The committed generated file is protected by the package
   export/test workflow.
5. `apps/catalog` is an isolated component and visual review surface. Its
   `catalog:*` tasks remain outside the default repository gates; package changes
   are promoted through the normal package checks and app verification.
6. APCA remains the engineering contrast target when current design-system
   source/tests enforce it. WCAG reporting bridges are informative and do not
   replace the project’s APCA gates.

## Consequences

The package graph and CSS source expose one predictable platform contract.
Generated consumers can be checked against human-authored tokens without
creating a second place to edit them. The catalog is useful for review without
expanding the default product gate. New public surfaces require an explicit
subpath decision.

## Alternatives considered

- **A root barrel export:** rejected because it creates an implicit, side-effect-
  prone public surface and weakens package boundary review.
- **DTCG as the authoring source:** rejected because CSS is the human-maintained
  cascade consumed by the product and catalog.
- **Put the catalog in default product gates:** rejected because it is an
  isolated review surface with its own explicit tasks.
- **Use WCAG 2.x as the primary engineering gate:** rejected because current
  design-system tests and optical targets are expressed in APCA.

## References

- [UI package manifest](../../packages/ui/package.json)
- [UI package rules](../../packages/ui/AGENTS.md)
- [token source](../../packages/ui/src/styles/tokens.css)
- [brand contract](../../packages/ui/src/styles/brand.css)
- [DTCG export test](../../packages/ui/src/test/dtcg-export.test.ts)
- [catalog package](../../apps/catalog/package.json)
- [catalog workspace guide](../../apps/catalog/AGENTS.md)
- [design-system convention](../conventions/design-system.md)
