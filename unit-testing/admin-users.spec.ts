import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Paginated Users List', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@eshikho.com');
    await page.fill('input[type="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Navigate to Admin Dashboard
    await page.waitForURL('/admin/dashboard');
  });

  test('Pagination limits and users are displayed correctly', async ({ page }) => {
    // Wait for the users table to load
    const userTable = page.locator('table').last();
    await expect(userTable).toBeVisible();

    // Check default limit is 25
    await expect(page.locator('select#limit-select')).toHaveValue('25');

    // Change limit to 50
    await page.locator('select#limit-select').selectOption('50');
    // Ensure the loading overlay appears and disappears
    await page.waitForTimeout(500); // Give it time to fetch
  });

  test('Admin can search for a user by email', async ({ page }) => {
    // Search for student
    const searchInput = page.locator('input[type="email"][placeholder*="Search"]');
    await searchInput.fill('example.com');
    await page.locator('button:has-text("Search")').click();

    // The table should have the searched user
    const tableRow = page.locator('table').last().locator('tbody tr').first();
    await expect(tableRow).toContainText('example.com');
  });
});
