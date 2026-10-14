import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['__tests__/unit-testing/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '__tests__/ui-testing/**/*',
      '__tests__/integration-testing/**/*',
      'node_modules/**/*',
      '.next/**/*',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
