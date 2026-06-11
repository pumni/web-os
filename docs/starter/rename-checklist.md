# Rename Checklist

Use this checklist when cloning the starter for a new product.

## Package Identity

- Update the root `package.json` `name`.
- Update `apps/web/package.json` `name` if the app should not be named `web`.
- Decide whether to keep the `@pumni/*` internal package scope.
- If changing the package scope, update imports, package names, and TypeScript
  path aliases together.

## Product Branding

- Update metadata in `apps/web/src/app/layout.tsx`.
- Update landing, sign-in, sign-up, and dashboard copy.
- Replace favicon and public assets.

## Supabase

- Update `supabase/config.toml` `project_id`.
- Create a new Supabase project or run the local stack.
- Copy `apps/web/.env.example` to `apps/web/.env.local`.
- Set the project URL and publishable key.
- Set the server-only service role or secret key only if server admin code needs
  it.
- Run migrations before building product features.

## Verification

Run:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

The starter is ready for feature work only after all gates pass.
