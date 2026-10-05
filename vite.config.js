import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose VITE_USE_MOCK to the app as a build-time constant
      __VITE_USE_MOCK__: JSON.stringify(env.VITE_USE_MOCK ?? 'false'),
    },
    // Tell the dev-server dependency scanner to skip yahoo-finance2.
    // It is a Node.js-only package; the browser always uses mock data or a
    // backend proxy and never imports this package directly.
    optimizeDeps: {
      exclude: ['yahoo-finance2'],
    },
    build: {
      rolldownOptions: {
        // Externalise from the production bundle for the same reason.
        external: ['yahoo-finance2'],
      },
    },
  };
});
