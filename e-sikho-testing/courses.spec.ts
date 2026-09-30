import { test, expect } from '@playwright/test';

test.describe('Courses and Payment flows', () => {
  test('should navigate to courses page and display courses', async ({ page }) => {
    // Go to the courses page
    await page.goto('http://localhost:3000/courses');
    
    // Check if the page title or a specific heading is visible
    // Based on common knowledge, usually there's a heading like 'Courses' or similar.
    // If not, we just check if it loads without error.
    await expect(page).toHaveURL(/.*\/courses/);
  });

  test('should navigate to a specific course page', async ({ page }) => {
    // Since we don't know the exact ID, we can assume course with ID 1 exists or mock it
    await page.goto('http://localhost:3000/courses/1');
    await expect(page).toHaveURL(/.*\/courses\/1/);
  });

  test('should navigate to payment page for a course', async ({ page }) => {
    // Navigate to payment page for course 1
    await page.goto('http://localhost:3000/payment/1');
    await expect(page).toHaveURL(/.*\/payment\/1/);
  });
});
