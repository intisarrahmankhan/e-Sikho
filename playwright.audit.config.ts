import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/ui-testing',
  testMatch: 'audit-smoke.spec.ts',
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], channel: 'chrome', baseURL: 'http://localhost:3100', headless: true },
  webServer: { command: 'npm run start -- --port 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 60000 },
});
