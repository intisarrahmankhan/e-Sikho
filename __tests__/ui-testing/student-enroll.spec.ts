import { test, expect } from '@playwright/test';

test.describe('Student Course Enrollment', () => {
  test('should login as student, view a course, and save a screenshot as proof', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Take an initial screenshot
    await page.screenshot({ path: 'playwright-proof/1-courses-page.png' });

    // Login flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign in with Email")');

    // Should reach the student dashboard
    await page.waitForURL('**/student**');
    
    // Take screenshot of the student dashboard
    await page.screenshot({ path: 'playwright-proof/2-student-dashboard.png' });

    // Navigate to a specific course (assuming course ID 1 exists or mock it)
    await page.goto('/courses/1');
    
    // Take a screenshot of the course details page
    await page.screenshot({ path: 'playwright-proof/3-course-details.png' });
    
    // Click on enroll or payment (we'll just take a screenshot to show we can interact)
    const enrollBtn = page.locator('text=Enroll').first();
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(1000); // wait for modal or transition
      await page.screenshot({ path: 'playwright-proof/4-course-enrollment-action.png' });
    }
  });
});
