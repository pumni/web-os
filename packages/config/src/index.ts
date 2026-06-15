/**
 * Shared configuration for the Pumni Web OS monorepo.
 *
 * Cross-package constants (app metadata, route maps, feature flags) live here
 * so apps and packages share a single source of truth. Keep this free of
 * runtime secrets — use `@pumni/env` for validated environment variables.
 */

export const APP_NAME = 'Pumni Web OS';

export const siteConfig = {
  name: APP_NAME,
  description:
    'A modern, reusable SaaS Starter base with Next.js App Router, Bun workspaces, and Supabase SSR.',
} as const;

export type SiteConfig = typeof siteConfig;
