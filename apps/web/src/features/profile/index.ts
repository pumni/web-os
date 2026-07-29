/**
 * @pumni/profile — server-side public API barrel.
 *
 * Re-exports server-only modules (queries, actions) for Server Components and
 * route handlers. Client components are NOT re-exported here on purpose; client
 * components in this feature carry `'use client'` and live in their own files,
 * which callers import via the component's own subpath.
 */

// fallow-ignore-file mixed-client-server-barrel -- barrel re-exports a client component (ProfileForm) alongside server-only modules; the layout is intentional and split into the public API (server-only here) + direct client-component imports. See apps/web/src/features/AGENTS.md.
export * from './queries';
export * from './actions';
export { ProfileForm } from './profile-form';
