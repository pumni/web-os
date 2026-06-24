import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
    exclude: ['src/test/validators/**/*.test.ts', 'src/test/scripts/**/*.test.ts', 'node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
