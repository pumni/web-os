import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Ladle auto-merges this config. The Tailwind v4 Vite plugin processes the
// `@import 'tailwindcss'` + `@source`/`@import '@pumni/ui/styles/*'` graph in
// src/styles/globals.css, so catalog stories get the real token cascade.
export default defineConfig({
  plugins: [tailwindcss()],
});
