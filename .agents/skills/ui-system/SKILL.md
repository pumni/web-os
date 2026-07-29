---
name: ui-system
description: Apply Pumni OS design-system tokens, surface roles, glass vs solid surfaces, motion, and personalization tokens. Use when styling UI components in packages/ui or apps/web.
---

# UI System & Design Tokens

Guidelines for applying Pumni OS design system tokens, surface roles, and theme variables.

## Rules

1. **Token Boundaries**: All colors must use tokens (`var(--surface-*)`, `var(--text-*)`, `var(--border-*)`). Raw `oklch()` or primitive variables (`--indigo-*`) fail ESLint design token rules (`pumniNoRawColor`).
2. **Surface Roles**: Glass surfaces (`glass-panel`) are for floating/portaled overlays. Solid surfaces (`surface-raised`) are for dense content containers.
3. **Subpath Imports**: Always import components from subpath entry points (e.g. `@pumni/ui/form`, `@pumni/ui/overlay`). Barrel imports (`@pumni/ui`) are unsupported.

## Checklist

- [ ] Used semantic tokens instead of hardcoded color primitives.
- [ ] Subpath imports used for `@pumni/ui` primitives.
- [ ] `bun run lint` (runs design-token ESLint rules) && `bun --filter @pumni/ui typecheck` pass.
