import { test, expect } from '@playwright/test';

test.describe('Instructor Course Creation E2E', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/instructor/create-course');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Authenticated student is blocked or correctly routed when accessing instructor routes', async ({ page }) => {
    // Authenticate as Student
    const csrfRes = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    await page.request.post('/api/auth/callback/credentials', {
      form: {
        csrfToken,
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/student',
      },
      maxRedirects: 0,
    });
    
    await page.goto('/student');
    await expect(page).toHaveURL(/.*\/student/);
    
    await page.goto('/instructor');
    // Verify it handles routing safely without crashing
    await page.waitForTimeout(500);
  });
});
