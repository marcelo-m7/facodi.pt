import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['services/env.ts', 'services/catalogSource.ts', 'utils/routeRegistry.ts', 'utils/seoMetadata.ts', 'utils/authGuards.ts'],
      thresholds: {
        lines: 50,
        functions: 80,
        branches: 60,
        statements: 50,
      },
    },
  },
});
