import { test, expect } from '@playwright/test';

test('home and catalog load without browser exceptions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  expect((await page.goto('/'))?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
  expect((await page.goto('/courses'))?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('login page has no developer shortcuts', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /Test as Instructor|Test as Student/ })).toHaveCount(0);
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});

for (const route of ['/student', '/instructor', '/admin', '/payment/507f1f77bcf86cd799439010']) {
  test(`requires sign-in for ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  });
}

test('unverified payment cannot grant enrollment', async ({ request }) => {
  const response = await request.post('/api/payment/confirm', { data: { courseId: '507f1f77bcf86cd799439010', status: 'success' } });
  expect(response.status()).toBe(401);
});

test('public course metadata does not expose lesson media URLs', async ({ page, request }) => {
  await page.goto('/courses');
  const courseLink = page.locator('a[href^="/courses/"]').first();
  test.skip(await courseLink.count() === 0, 'No published courses remain after the confirmed sample cleanup.');
  const href = await courseLink.getAttribute('href');
  const response = await request.get(`/api${href}`);
  expect(response.ok()).toBe(true);
  const course = await response.json();
  for (const courseModule of course.modules || []) for (const lesson of courseModule.lessons || []) {
    expect(lesson).not.toHaveProperty('videoUrl');
    expect(lesson).not.toHaveProperty('pdfUrl');
    expect(lesson).not.toHaveProperty('bunnyVideoId');
  }
});
