import { test, expect } from '@playwright/test';

test.describe('Courses and Payment flows', () => {
  test('should navigate to courses page and display courses', async ({ page }) => {
    await page.goto('/courses');
    await expect(page).toHaveURL(/.*\/courses/);
  });

  test('should navigate to a specific course page', async ({ page }) => {
    await page.goto('/courses/1');
    await expect(page).toHaveURL(/.*\/courses\/1/);
  });

  test('should redirect unauthenticated users to login from payment page', async ({ page }) => {
    await page.goto('/payment/1');
    await expect(page).toHaveURL(/.*\/login\?callbackUrl=.*payment.*/);
  });
});
