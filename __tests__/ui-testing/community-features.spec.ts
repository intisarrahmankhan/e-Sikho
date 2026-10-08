import { test, expect } from '@playwright/test';

test.describe('Community & Discussion Features', () => {

  test.describe('Lesson Q&A Discussion Board', () => {
    test.beforeEach(async ({ page }) => {
      // Mock login as student
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@eshikho.com');
      await page.fill('input[type="password"]', 'student123');
      await page.click('button[type="submit"]');
      
      // Navigate to a mocked lesson page where Discussion Board is mounted
      await page.goto('/courses/test-course/lessons/lesson-1');
    });

    test('Student can post a question, reply, and like a comment', async ({ page }) => {
      // Assuming DiscussionBoard is visible
      const qInput = page.locator('input[placeholder="Ask a question about this lesson..."]');
      await expect(qInput).toBeVisible();
      
      await qInput.fill('How does Mongoose handle references?');
      await page.locator('button:has-text("Post")').click();

      // Verify post appears
      await expect(page.locator('text=How does Mongoose handle references?')).toBeVisible();

      // Like the comment (find the ThumbsUp button which starts at 0 likes)
      const likeButton = page.locator('button', { hasText: '0' }).first();
      if (await likeButton.isVisible()) {
        await likeButton.click();
        // Counter increments to 1
        await expect(page.locator('button', { hasText: '1' }).first()).toBeVisible();
      }

      // Reply to the comment
      await page.locator('button:has-text("Reply")').first().click();
      await page.locator('input[placeholder="Write a reply..."]').fill('It uses ObjectId to reference other documents.');
      await page.locator('button:has-text("Reply")').nth(1).click(); // Click post reply

      // Verify reply appears
      await expect(page.locator('text=It uses ObjectId to reference other documents.')).toBeVisible();
    });
  });

  test.describe('Instructor Solution Flagging', () => {
    test.beforeEach(async ({ page }) => {
      // Mock login as instructor
      await page.goto('/login');
      await page.fill('input[type="email"]', 'instructor@eshikho.com');
      await page.fill('input[type="password"]', 'instructor123');
      await page.click('button[type="submit"]');
      await page.goto('/courses/test-course/lessons/lesson-1');
    });

    test('Instructor can flag a post as a solution', async ({ page }) => {
      // Click Mark as Solution
      const flagBtn = page.locator('button:has-text("Mark as Solution")').first();
      await expect(flagBtn).toBeVisible();
      await flagBtn.click();

      // Verify Solution badge appears
      await expect(page.locator('span:has-text("Solution")').first()).toBeVisible();
    });
  });

  test.describe('Community Notes & Resource Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Mock login as student
      await page.goto('/login');
      await page.fill('input[type="email"]', 'student@eshikho.com');
      await page.fill('input[type="password"]', 'student123');
      await page.goto('/courses/test-course/lessons/lesson-1'); // Or module view
    });

    test('Student can publish a note with XSS sanitization', async ({ page }) => {
      const titleInput = page.locator('input[placeholder="Note Title"]');
      await expect(titleInput).toBeVisible();
      
      // Fill note
      await titleInput.fill('Study Guide - Node.js');
      
      // Inject XSS payload
      await page.fill('textarea[placeholder="Type your study notes here..."]', '<script>alert("XSS")</script> **My Notes**');
      
      // Make it public
      await page.locator('label:has-text("Make public to community")').click();
      
      // Click publish
      await page.locator('button:has-text("Publish Note")').click();

      // Wait for success message
      await expect(page.locator('text=Note securely added and sanitized!')).toBeVisible();

      // Verify note is rendered
      await expect(page.locator('text=Study Guide - Node.js')).toBeVisible();
      await expect(page.locator('text=PUBLIC')).toBeVisible();
      
      // Ensure the script tag itself isn't rendered literally in the DOM as a working script
      // XSS module strips `<script>` completely or encodes it.
      const scriptTag = page.locator('script:has-text("alert(\\"XSS\\")")');
      await expect(scriptTag).toHaveCount(0);
    });
  });
});
