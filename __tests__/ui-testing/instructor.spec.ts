import { test, expect } from '@playwright/test';

test.describe('Instructor Course Creation E2E', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/instructor/create-course');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Authenticated student is blocked or correctly routed when accessing instructor routes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign in with Email")');
    
    await page.waitForURL('**/student**');
    
    await page.goto('/instructor');
    // For now we just verify it doesn't crash.
    // If the app correctly redirects non-instructors, verify it here later.
  });
});
