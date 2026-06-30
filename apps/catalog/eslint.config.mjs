import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', '.turbo/**', 'dist/**', 'storybook-static/**', 'build/**'] },
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
  },
  ...storybook.configs['flat/recommended'],
);
