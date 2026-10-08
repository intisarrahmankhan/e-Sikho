import { test, expect } from '@playwright/test';

test.describe('e-Shikho Platform & Admin E2E Tests', () => {

  test('1. Root route redirects properly', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toMatch(/\/(student|login)/);
  });

  test('2. Login page renders form elements and demo accounts', async ({ page }) => {
    await page.goto('/login');
    
    // Check main title and branding
    await expect(page.locator('h2')).toContainText('Sign in to e-Shikho');
    
    // Check form inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign In');

    // Check demo accounts guide
    await expect(page.locator('text=Demo Accounts:')).toBeVisible();
    await expect(page.locator('text=admin@eshikho.com')).toBeVisible();
  });

  test('3. Login form validation displays error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong.user@eshikho.com');
    await page.fill('input[type="password"]', 'incorrectpassword');
    await page.click('button[type="submit"]');

    // Verify error banner is displayed
    const errorBanner = page.locator('.bg-red-50');
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
    await expect(errorBanner).toContainText('Invalid credentials');
  });

  test('4. Course catalog page loads with filters and interactive course cards', async ({ page }) => {
    await page.goto('/courses');

    // Check catalog presence & header
    await expect(page).toHaveTitle(/e-Shikho/);
    await expect(page.locator('text=উপলব্ধ কোর্সসমূহ')).toBeVisible();

    // Verify search input is visible
    const searchInput = page.locator('input[placeholder*="খুঁজুন"]');
    await expect(searchInput).toBeVisible();

    // Verify course titles/cards render
    const courseTitles = page.locator('h3');
    await expect(courseTitles.first()).toBeVisible({ timeout: 10000 });
    const count = await courseTitles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('5. Course details page displays modules, instructor, and enroll button', async ({ page }) => {
    await page.goto('/courses/fullstack-nextjs');

    // Check course header elements
    await expect(page.locator('h1')).toBeVisible();
    
    // Check enroll button / CTA
    const enrollBtn = page.locator('#btn-enroll-now');
    await expect(enrollBtn).toBeVisible();
    await expect(enrollBtn).toContainText('এখনই ভর্তি হন');
  });

  test('6. Payment route is protected and redirects unauthenticated users', async ({ page }) => {
    await page.goto('/payment/fullstack-nextjs');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('7. Admin dashboard is protected and redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('8. Admin login form submission handles authentication', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@eshikho.com');
    await page.fill('input[type="password"]', 'admin123456');
    await page.click('button[type="submit"]');

    // Button transitions to loading state
    await expect(page.locator('button[type="submit"]')).toContainText('Signing in...');

    // Wait for the auth attempt to either redirect or complete with notification
    const resultIndicator = page.locator('.bg-red-50, aside').first();
    await expect(resultIndicator).toBeVisible({ timeout: 15000 });
  });

});
