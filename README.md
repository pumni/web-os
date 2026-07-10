# Pumni Web OS

Pumni Web OS is a reusable web application platform built on a Turborepo monorepo with Next.js 16, React, and Supabase, preserving its design-system starter heritage.

The repo is intentionally small: it provides auth, profile settings, shared
validation, Supabase client factories, and quality gates so a new app can start
from feature work instead of framework setup.

## Stack

- Bun workspace monorepo
- Turborepo task orchestration
- Next.js App Router
- React
- Tailwind CSS v4
- Supabase Auth, Postgres, RLS, and SSR clients
- Zod validation
- Vitest and Playwright

## Quick Start

```bash
bun install
Copy-Item apps/web/.env.example apps/web/.env.local
bun run dev
```

Open `http://localhost:3000`.

For local Supabase development:

```bash
npx supabase start
npx supabase db reset
```

Then copy the local Supabase URL and publishable key into
`apps/web/.env.local`.

## Required Environment

`apps/web/.env.local` must define:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-or-secret-key
```

Only `NEXT_PUBLIC_*` variables are exposed to the browser.
`SUPABASE_SERVICE_ROLE_KEY` must stay server-only.

## Commands

```bash
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
```

Run all four quality gates before merging starter changes:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

## Structure

```text
apps/web                 Next.js application
packages/auth            Server-only auth helpers
packages/env             Runtime environment validation
packages/supabase        Supabase browser/server/proxy clients
packages/validators      Shared Zod schemas
packages/ui              Shared UI primitives
supabase/migrations      Database schema, RLS, and grants
docs                     Architecture and conventions
```

## Starting A New App

1. Clone the repo.
2. Rename the root package and app metadata.
3. Decide whether to keep or replace the `@pumni/*` package scope.
4. Update `supabase/config.toml` `project_id`.
5. Create `apps/web/.env.local` from `apps/web/.env.example`.
6. Run the quality gates.
7. Start feature work under `apps/web/src/features`.
