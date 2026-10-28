import { defineConfig, devices } from '@playwright/test';
const isolatedDatabase = process.env.ASSESSMENT_WORKFLOW_ISOLATED_DB || '';
if (!/^e_sikho_assessment_test_[a-f0-9]{12}$/.test(isolatedDatabase) || new URL(process.env.MONGODB_URI || 'http://invalid').pathname !== '/' + isolatedDatabase) throw new Error('Run node scripts/test-assessment-workflows.mjs to use an isolated database.');
export default defineConfig({
  testDir: './__tests__/ui-testing', testMatch: 'assessment-workflows.spec.ts',
  workers: 1, fullyParallel: false, timeout: 60000, reporter: 'list',
  use: { ...devices['Desktop Chrome'], channel: 'chrome', baseURL: 'http://localhost:3101', timezoneId: 'Asia/Dhaka', headless: true },
  webServer: { command: 'npm run start -- --port 3101', url: 'http://localhost:3101', reuseExistingServer: false, timeout: 60000 },
});
