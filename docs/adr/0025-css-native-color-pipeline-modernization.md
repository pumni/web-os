# 0025. CSS-Native Color Pipeline Modernization

- **Status:** Accepted
- **Date:** 2026-07-04
- **Owner:** Design System Team

## Context

The `@pumni/ui` design system relies on static OKLCH color declarations that are manually duplicated between light mode (`:root`) and dark mode (`.dark`) blocks across multiple stylesheets. Furthermore, deriving adjacent shades (such as ring focus and gradient stops) for user accent personalization requires maintaining extensive hand-tuned tables in `personalization.css`. 

To streamline token authoring and maintainability, we want to migrate to modern CSS features, specifically `light-dark()` and relative color syntax (`oklch(from ...)`). However, adopting these features requires updating the token parsers in the build pipeline (`export-dtcg.ts`) and test suite (`glass-contrast.test.ts`), which previously resolved only basic `var()` references.

## Decision

We will:
1. **Unify token resolution:** Extract all variable, color, and mix resolution algorithms from test/build scripts into a single, shared module `token-resolver.ts` to ensure consistency.
2. **Teach the resolver modern syntax:** Expand the shared resolver to parse and resolve `light-dark(A, B)` (selecting branch by mode) and `oklch(from <color> L C H [/ A])` relative colors.
3. **Limit the relative-color grammar:** To keep build-time resolution predictable, we only support a minimal grammar for relative channel expressions: literal numbers, channel identifiers (`l`/`c`/`h`/`alpha`), or simple calc expressions (`calc(<ident> <op> <number>)`).
4. **Retain APCA contrast authority:** Modernized colors will continue to be validated against the sRGB APCA gate in `glass-contrast.test.ts`.

## Consequences

- **Positive:** Reduces token file duplication by consolidating light/dark definitions into single `:root` rules using `light-dark()`.
- **Positive:** Simplifies accent personalization definitions by deriving accent stops systematically using relative OKLCH rather than hardcoding static tables.
- **Negative:** Build and test tools must parse complex relative-color syntax, increasing resolver codebase complexity.
- **Neutral:** Composite colors like `color-mix()` and complex relative colors remain excluded from simple primitive DTCG v1 scalar export, but will be parsed in modern DTCG v2.

## Alternatives considered

- **Alternative 1: Keep dark blocks separate.** Rejected because separate dark blocks invite drift and forgot-to-override bugs on new components.
- **Alternative 2: Use Style Dictionary or Terrazzo.** Rejected to avoid introducing external tooling dependencies; hand-authored CSS with custom parser-checkers remains the project's source of truth.
