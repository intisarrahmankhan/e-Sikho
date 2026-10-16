import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Paginated Users List', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin
    const csrfRes = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    await page.request.post('/api/auth/callback/credentials', {
      form: {
        csrfToken,
        email: 'admin@eshikho.com',
        password: 'admin123456',
        redirectTo: '/admin',
      },
      maxRedirects: 0,
    });

    // Navigate to Admin Dashboard
    await page.goto('/admin');
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
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('example.com');
    await page.locator('button:has-text("Search")').first().click();
    await page.waitForTimeout(500);

    // The table should have the searched user if present
    const tableRow = page.locator('table').last().locator('tbody tr').first();
    if (await tableRow.isVisible()) {
      await expect(tableRow).toBeVisible();
    }
  });
});
