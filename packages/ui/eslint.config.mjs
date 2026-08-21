import tseslint from 'typescript-eslint';

import {
  pumniNoRawColor,
  pumniNoAdHocSurface,
  pumniNoRawTiming,
  pumniUiBoundary,
  pumniNoRawZIndex,
  pumniEslintPluginConfig,
} from '@pumni/config/eslint';

/**
 * @pumni/ui lint config. Intentionally minimal: it enables TypeScript parsing
 * and the shared purity/boundary rules from @pumni/config — it is not a broad
 * style ruleset. The goal is to catch security/boundary violations early, not
 * to relitigate the whole codebase.
 */
export default tseslint.config(
  { ignores: ['node_modules/**', '.turbo/**', 'dist/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
  },
  ...pumniEslintPluginConfig,
  ...pumniUiBoundary,
  ...pumniNoRawColor,
  ...pumniNoAdHocSurface,
  ...pumniNoRawTiming,
  ...pumniNoRawZIndex,
);
