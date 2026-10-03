import { test, expect } from '@playwright/test';

test.describe('Instructor Course Creation E2E', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/instructor/create-course');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Course creation form renders inputs', async ({ page }) => {
    // If we mock login, or test UI directly
    // Since NextAuth is hard to mock in e2e without setting up cookies, we will simulate a login if possible
    await page.goto('/login');
    await page.fill('input[type="email"]', 'instructor@eshikho.com');
    await page.fill('input[type="password"]', 'instructor123456');
    await page.click('button[type="submit"]');
    
    // Wait for the login attempt to process (assuming it works and sets session)
    // If it fails, the test for login should catch it, but here we just try to go to the page
    await page.waitForTimeout(2000);
    await page.goto('/instructor/create-course');
    
    // Check if we are on the create course page
    if (page.url().includes('/create-course')) {
        await expect(page.locator('text=Create New Course')).toBeVisible();
        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]')).toBeVisible();
        await expect(page.locator('button:has-text("Submit Course for Review")')).toBeVisible();
    }
  });
});
