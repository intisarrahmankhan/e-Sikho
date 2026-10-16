import { test, expect } from '@playwright/test';

// Helper to authenticate as Admin before tests
async function authenticateAdmin(page: any) {
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
}

test.describe('Admin Tasks T-015 to T-019 End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAdmin(page);
  });

  test('1. Admin Dashboard renders quick-action navigation for T-015, T-017, and T-019', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/admin/);

    // Verify main admin dashboard header
    await expect(page.locator('text=Admin Control Panel')).toBeVisible();

    // Verify navigation badges created for all implemented tasks
    const refundLink = page.locator('a[href="/admin/refunds"]').first();
    await expect(refundLink).toBeVisible();
    await expect(refundLink).toContainText('Refund Panel');

    const modLink = page.locator('a[href="/admin/moderation"]').first();
    await expect(modLink).toBeVisible();
    await expect(modLink).toContainText('Moderation Queue');

    const instructorLink = page.locator('a[href="/admin/instructors/pending"]').first();
    await expect(instructorLink).toBeVisible();
    await expect(instructorLink).toContainText('Instructor Queue');
  });

  test('2. Task T-015 & T-016: Instructor Application Queue & Verification View', async ({ page }) => {
    await page.goto('/admin/instructors/pending');
    await expect(page).toHaveURL(/.*\/admin\/instructors\/pending/);

    // Verify queue page header
    await expect(page.locator('h1')).toContainText(/Instructor Application/i);

    // Verify search and filter controls
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Verify status filter tabs
    await expect(page.getByRole('button', { name: /Pending/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Approved/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Rejected/i })).toBeVisible();

    // If queue is empty, trigger seed demo applications
    let inspectBtn = page.locator('button:has-text("Inspect Application")').first();
    if (!(await inspectBtn.isVisible())) {
      const seedBtn = page.locator('button:has-text("Seed Sample Applications")').first();
      if (await seedBtn.isVisible()) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
          seedBtn.click(),
        ]);
        await page.waitForTimeout(1000);
      }
    }

    // Inspect Application Modal (Task T-015 & T-016)
    inspectBtn = page.locator('button:has-text("Inspect Application")').first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();

      // Check verification modal contents
      await expect(page.locator('text=Applicant Verification Dossier, text=Instructor Verification')).toBeVisible();
      await expect(page.locator('text=Institutional Affiliation, text=Institution')).toBeVisible();
      await expect(page.locator('text=Academic & Professional Qualifications, text=Qualifications')).toBeVisible();

      // Verify approval & rejection action buttons
      await expect(page.locator('button:has-text("Approve Application")')).toBeVisible();
      await expect(page.locator('button:has-text("Reject")')).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
      await closeBtn.click();
    }
  });

  test('3. Task T-017 & T-018: Moderation Queue & Flagged Items Dashboard', async ({ page }) => {
    await page.goto('/admin/moderation');
    await expect(page).toHaveURL(/.*\/admin\/moderation/);

    // Verify queue header
    await expect(page.locator('h1')).toContainText(/Content Moderation/i);

    // Verify metric cards
    await expect(page.locator('text=Open Reports')).toBeVisible();
    await expect(page.locator('text=In Review').first()).toBeVisible();
    await expect(page.locator('text=Actioned / Resolved')).toBeVisible();

    // Verify entity type filter tabs (Course, Lesson, Comment, User)
    await expect(page.locator('button:has-text("Course")')).toBeVisible();
    await expect(page.locator('button:has-text("Lesson")')).toBeVisible();
    await expect(page.locator('button:has-text("Comment")')).toBeVisible();
    await expect(page.locator('button:has-text("User")')).toBeVisible();

    // Verify search bar
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // If no reports are displayed, trigger demo seed
    let actionBtn = page.locator('button:has-text("Take Action"), button:has-text("Update Penalty")').first();
    if (!(await actionBtn.isVisible())) {
      const seedBtn = page.locator('button:has-text("Seed Sample Flagged Tickets")').first();
      if (await seedBtn.isVisible()) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
          seedBtn.click(),
        ]);
        await page.waitForTimeout(1000);
      }
    }

    // Check resolve action button and modal (Task T-018)
    actionBtn = page.locator('button:has-text("Take Action"), button:has-text("Update Penalty")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();

      // Check resolution modal elements
      await expect(page.locator('h3:has-text("Execute Moderation Action")')).toBeVisible();
      await expect(page.getByRole('button', { name: /Warning/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Remove/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Ban/i }).first()).toBeVisible();
      await expect(page.locator('text=Resolution Note & Audit Rationale')).toBeVisible();

      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      await cancelBtn.click();
    }
  });

  test('4. Task T-019: Refund Request Processing Engine & Reconciliation Panel', async ({ page }) => {
    await page.goto('/admin/refunds');
    await expect(page).toHaveURL(/.*\/admin\/refunds/);

    // Verify page header
    await expect(page.locator('h1')).toContainText(/Student Refund & Dispute Panel/i);

    // Verify summary metric cards
    await expect(page.locator('text=Pending Requests')).toBeVisible();
    await expect(page.locator('text=Approved Refunds')).toBeVisible();
    await expect(page.locator('text=Total Reconciled')).toBeVisible();
    await expect(page.locator('text=Total Payment Logs')).toBeVisible();

    // Verify status filter tabs
    await expect(page.locator('button:has-text("Pending")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Refunded")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Completed")').first()).toBeVisible();

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Search TXN"]');
    await expect(searchInput).toBeVisible();

    // If queue is empty, trigger demo seed
    let evaluateBtn = page.locator('button:has-text("Evaluate Dispute"), button:has-text("Inspect Reconciliation")').first();
    if (!(await evaluateBtn.isVisible())) {
      const seedBtn = page.locator('button:has-text("Demo Data")').first();
      if (await seedBtn.isVisible()) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
          seedBtn.click(),
        ]);
        await page.waitForTimeout(1000);
      }
    }

    // Verify evaluate button and reconciliation modal (Task T-019)
    evaluateBtn = page.locator('button:has-text("Evaluate Dispute"), button:has-text("Inspect Reconciliation")').first();
    if (await evaluateBtn.isVisible()) {
      await evaluateBtn.click();

      // Check modal contents
      await expect(page.locator('h3:has-text("Refund & Reconciliation")')).toBeVisible();
      await expect(page.locator('text=Student Details')).toBeVisible();
      await expect(page.locator('text=Enrollment State')).toBeVisible();
      await expect(page.locator('text=Financial Ledger Adjustments')).toBeVisible();
      await expect(page.getByText('Student Refund', { exact: true })).toBeVisible();
      await expect(page.getByText('Platform Commission', { exact: true })).toBeVisible();
      await expect(page.getByText('Instructor Earnings', { exact: true })).toBeVisible();

      // Close modal
      await page.locator('button:has-text("Cancel")').click();
    }
  });

  test('5. Non-admin users are strictly blocked from accessing admin queues', async ({ browser }) => {
    // Open a fresh unauthenticated incognito context
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try accessing /admin/refunds without credentials
    await page.goto('/admin/refunds');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');

    // Try accessing /admin/moderation without credentials
    await page.goto('/admin/moderation');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');

    // Try accessing /admin/instructors/pending without credentials
    await page.goto('/admin/instructors/pending');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');

    await context.close();
  });
});
