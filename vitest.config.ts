import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: ['node_modules', 'e-sikho-testing', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
