import { test, expect } from '@playwright/test';

test.describe('Login Page flows', () => {
  test('should render the login page correctly', async ({ page }) => {
    await page.goto('/login');

    // Check if the logo/title exists
    await expect(page.locator('text=e-Shikho')).toBeVisible();

    // Check if the sign in button exists
    const signInButton = page.locator('button', { hasText: /Google/i });
    await expect(signInButton).toBeVisible();
    
    // Check if info texts are visible
    await expect(page.locator('text=সাইন ইন করার মাধ্যমে আপনি আমাদের')).toBeVisible();
  });

  test('should display payment warning if callbackUrl is a payment route', async ({ page }) => {
    await page.goto('/login?callbackUrl=/payment/123');

    // The payment warning should be visible
    await expect(page.locator('text=কোর্সটি কিনতে আগে লগইন করুন')).toBeVisible();
  });

  test('should redirect to google oauth when clicking sign in', async ({ page }) => {
    await page.goto('/login');

    const signInButton = page.locator('button', { hasText: /Google দিয়ে সাইন ইন করুন/i });
    
    // Listen for the navigation to Google
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('accounts.google.com') || req.url().includes('/api/auth/signin')),
      signInButton.click()
    ]);

    expect(request.url()).toContain('/api/auth/signin');
  });
});
