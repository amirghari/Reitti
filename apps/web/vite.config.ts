import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The config directory is the clinician's governance surface. V1 bundles it;
      // architecture v2 §5 moves it to a versioned CDN without touching the engine.
      '@config': fileURLToPath(new URL('../../config', import.meta.url)),
    },
  },
});
