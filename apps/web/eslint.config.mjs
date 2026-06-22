import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import {
  pumniNoRawColor,
  pumniNoAdHocSurface,
  pumniNoRawTiming,
  pumniFeatureBoundary,
  pumniFeaturePresentationBoundary,
} from '@pumni/config/eslint';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Token-first guard: forbid raw OKLCH / primitive / Tailwind palette colours in app source.
  ...pumniNoRawColor,
  // Surface-first guard: forbid ad-hoc surfaces.
  ...pumniNoAdHocSurface,
  // Timing-first guard: forbid raw Tailwind duration/ease utilities.
  ...pumniNoRawTiming,
  // Feature boundary guard: forbid importing feature internals from outside the feature.
  ...pumniFeatureBoundary,
  // Feature presentation boundary guard: forbid direct data/auth imports in UI components.
  ...pumniFeaturePresentationBoundary,

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
