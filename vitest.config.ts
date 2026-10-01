import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The same alias the web app's Vite config declares, so an app module that
  // reads config (assessmentLanguage.ts) can be unit-tested like the rest.
  resolve: {
    alias: {
      '@config': fileURLToPath(new URL('./config', import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: [
      'packages/**/test/**/*.test.ts',
      'apps/**/test/**/*.test.ts',
      'services/**/test/**/*.test.ts',
    ],
  },
});
