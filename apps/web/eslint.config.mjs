import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import {
  pumniNoRawColor,
  pumniNoAdHocSurface,
  pumniNoRawTiming,
  pumniFeatureBoundary,
  pumniNoRawZIndex,
  pumniEslintPluginConfig,
} from '@pumni/config/eslint';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pumniEslintPluginConfig,
  // Token-first guard: forbid raw OKLCH / primitive / Tailwind palette colours in app source.
  ...pumniNoRawColor,
  // Surface-first guard: forbid ad-hoc surfaces.
  ...pumniNoAdHocSurface,
  // Timing-first guard: forbid raw Tailwind duration/ease utilities.
  ...pumniNoRawTiming,
  // Feature boundary + presentation guard: forbid importing feature internals from
  // outside the feature, routing-layer imports inside features, and direct data/auth
  // imports in feature UI components. Rules are auto-derived from src/features/*.
  ...pumniFeatureBoundary(new URL('./src/features', import.meta.url)),
  // Z-index guard: warn on raw Tailwind z-classes in cross-component layers.
  ...pumniNoRawZIndex,

  // Service-role imports are an explicit server-side exception. Its dedicated
  // rule ID cannot clobber the independent design-system rules above.
  {
    name: 'pumni/service-role-import-boundary',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      'src/app/api/webhooks/polar/route.ts',
      'src/features/billing/jobs/functions.ts',
      'src/features/billing/queries.ts',
      'src/features/billing/webhook-handlers.ts',
      'src/features/profile/queries.ts',
      'src/features/watch/queries.ts',
      'src/shared/lib/audit.ts',
    ],
    rules: {
      'pumni/no-unapproved-service-role-import': 'error',
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
