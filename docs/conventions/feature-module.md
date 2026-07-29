---
description: Internal feature structure (layers, public APIs, cross-communication) and architectural boundaries. Use when creating or extending a feature under apps/web/src/features.
---

# Feature Module Architecture

All product capabilities live inside `apps/web/src/features/<feature-name>`. Each feature acts as a self-contained **"Mini-Application"** with clear boundaries, separating concerns into strict layers and exposing a minimal public API.

---

## 1. Internal Directory Anatomy

For simple features, files can reside flat under the feature directory. For complex features (e.g. `watch`), organize code into the following logical layers:

```text
features/my-feature/
├── components/           # 1. Presentation Layer (UI components only)
│   ├── main-widget.tsx
│   └── sub-panel.tsx
├── hooks/                # 2. Application Logic Layer (state, orchestrators)
│   ├── use-widget-state.ts
│   └── use-sync-engine.ts
├── actions.ts            # 3. Data Access Layer (mutations)
├── queries.ts            # 3. Data Access Layer (server reads)
├── client-queries.ts     # 3b. Client Data Access (optional, browser-side reads)
├── types.ts              # 4. Type Safety Boundary (domain types)
├── stores/               # 4b. Client UI Stores (optional, Zustand for feature-local state)
│   └── volume-store.ts
└── index.ts              # 5. Public API Firewall (entry point)
```

> `client-queries.ts` and `stores/` are optional extensions, used only when the feature has a real requirement for browser-side data access or independent UI state. Simple features can leave their files flat under the feature directory.

### Layer Responsibilities & Data Flow

*   **Data Access Layer (`queries.ts` & `actions.ts`)**:
    *   **Responsibilities**: Directly connect to the database/API using Supabase clients (`@pumni/supabase`).
    *   **Standards**: By default, the domain type is derived directly from the Supabase schema (`Database['public']['Tables'][...]['Row']`) — simple, single source of truth, no speculative adapter layers. Split a DTO/Adapter mapping to a clean Domain Model only when there is a real trigger: (a) a domain type is used by ≥2 features (promote to `packages/*` rather than duplicating), or (b) the database table schema changes frequently, leaking breaking changes to the UI. Until then, use the direct Row type.
*   **Business & State Layer (Application Layer - `hooks/`, State Stores)**:
    *   **Responsibilities**: Custom hooks orchestrating data (Zustand stores, TanStack Query hooks). Handle validation, business logic, and client-side cache state encapsulation.
    *   **Standards**: Do not render UI or markup directly here. Only expose clean data and interaction functions.
*   **Presentation Layer (`components/`)**:
    *   **Responsibilities**: Receive clean data from the Business Layer (via props or custom hooks) and render the UI.
    *   **Standards**: Do not invoke APIs directly (`fetch`/`axios` or Supabase clients) in display components. Prioritize Accessibility (A11y) and rendering performance.

---

## 2. Public API Firewall (`index.ts`)

Each feature must have an `index.ts` file acting as the **Public API Gate** (Firewall). Only export resources that are allowed to be used externally:

```typescript
// features/watch/index.ts

export { WatchRoom } from './components/watch-room';
export { WatchLobby } from './components/watch-lobby';
export type { Room } from './types';
// API logic, hooks, and supporting sub-components are completely hidden.
```

> [!IMPORTANT]
> **Firewall Rule**: External code can only import from the root of the feature (e.g. `@/features/watch`). Deep importing into the internals of a feature (e.g. `@/features/watch/queries` or `@/features/watch/components/room-card`) is forbidden and will cause build errors.
>
> *Exception:* Automated test files located under `apps/web/src/test/` (e.g. unit/integration tests) are explicitly allowed to deep-import feature internals to access specific test seams and mock behaviors.

---

## 3. Cross-Feature Communication

When Feature A needs to interact with or use data from Feature B, apply one of the following three models:

### Option 1: Move to the Shared Layer (Promotion Model)
If a component or business logic is used by multiple features and has a shared nature (utility formatters, general-purpose modals, primitives), refactor and move it to shared packages:
*   `packages/ui` for framework-agnostic UI primitives.
*   `packages/validators` for shared Zod validation schemas.
*   `apps/web/src/shared/components`, `src/shared/hooks`, etc. for internal shared resources.

### Option 2: Interact via Blackbox State Manager (Global State Model)
Use a Global UI Store (Zustand) or a Custom Events (Pub-Sub) mechanism to send signals without features knowing about each other's presence.

### Option 3: Composition Pattern at App/Page Layer (Recommended)
Keep features independent by designing them as "Lego blocks". The `app/` layer (Next.js routing pages) acts as the composer, wiring and passing data/callbacks between features.

```tsx
// src/app/(app)/dashboard/page.tsx
import { RecentRoomsCard, getRecentRooms } from '@/features/watch';
import { getCurrentProfile } from '@/features/profile';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const rooms = await getRecentRooms(profile.id);
  
  return <RecentRoomsCard rooms={rooms} />;
}
```

---

## 4. Architecture Enforcement

Architectural rules are automatically verified in CI/CD via ESLint. The list of features is derived directly from the filesystem (`readFeatureNames` in `packages/config/eslint.mjs`). A new `features/<name>/` directory is firewalled as soon as it exists, with no manual arrays to keep updated.

Since ESLint flat config does not merge two `no-restricted-imports` matching the same file (the latter overrides the former), all import restrictions for a file scope are combined into a single rule, split into three distinct scopes:

1.  **`pumni/feature-boundary-internal`** (`src/features/**/*.ts`): Blocks imports from the routing layer (`@/app`) to maintain portability, and blocks imports of internals of all other features. Self-imports using relative paths (`./`, `../`) are allowed.
2.  **`pumni/feature-boundary-internal-tsx`** (`src/features/**/*.tsx`): Same as above, plus the Presentation Purity constraint — UI components must not directly import `@pumni/supabase` or `@pumni/auth`; they must delegate to hooks, queries, or Server Actions.
3.  **`pumni/feature-boundary-external`** (`src/**`, excluding `src/features/**`): Code outside the feature (routes, shared components, lib) must only interact with features through the public API path (`@/features/<name>`), never reaching feature internals.

> [!NOTE]
> Emitting a config object per feature would fall into the override trap (only the last declared feature gets enforced). `check-feature-boundary.mjs` (run during `bun run ai:review`) automatically verifies that all features are enforced across all three scopes.

Run the validation check manually before committing:
```pwsh
bun run lint
```
