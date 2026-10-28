import { test, expect, Page, Browser } from '@playwright/test';
import { readFileSync } from 'node:fs';
test.describe.configure({ mode: 'serial' });
const fixture = JSON.parse(readFileSync('audit-local/assessment-test-context.json', 'utf8'));
async function signIn(browser: Browser, key: string) {
  const context = await browser.newContext({ timezoneId: 'Asia/Dhaka', baseURL: 'http://localhost:3101' });
  const page = await context.newPage();
  const csrf = await (await page.request.get('/api/auth/csrf')).json();
  await page.request.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email: fixture.users[key].email, password: fixture.password, callbackUrl: 'http://localhost:3101/' }, headers: { 'X-Auth-Return-Redirect': '1' } });
  const session = await (await page.request.get('/api/auth/session')).json();
  expect(session?.user?.id).toBe(fixture.users[key].id);
  return page;
}
async function approve(page: Page, kind: string) {
  await page.goto('/admin/assessments');
  const card = page.getByRole('article').filter({ hasText: `Global ${kind} hosting` }).filter({ hasText: 'Teacher Fixture' });
  await card.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(card.getByText('APPROVED', { exact: true })).toBeVisible();
}
let examUrl = ''; let contestUrl = '';
test('owned draft courses appear, and superadmin approval unlocks global exams', async ({ browser }) => {
  const teacher = await signIn(browser, 'teacher');
  await teacher.goto('/exams/create');
  const courses = teacher.getByRole('combobox', { name: 'Course', exact: true });
  await expect(courses.locator('option', { hasText: 'Owned Draft Course' })).toHaveCount(1);
  await expect(courses.locator('option', { hasText: 'Owned Published Course' })).toHaveCount(1);
  await expect(courses.locator('option', { hasText: 'Other Instructor Course' })).toHaveCount(0);
  await expect(teacher.locator('option[value="GLOBAL"]')).toHaveJSProperty('disabled', true);
  await expect(teacher.locator('#question-card-0 textarea').first()).toHaveValue('');
  await teacher.goto('/instructor/assessments');
  await teacher.getByLabel('Teaching purpose and intended audience').fill('A mathematics assessment for school science students.');
  await teacher.getByRole('button', { name: 'Submit application' }).click();
  await expect(teacher.getByText('PENDING', { exact: true })).toBeVisible();
  const admin = await signIn(browser, 'admin'); await approve(admin, 'exam');
  await teacher.goto('/exams/create'); await expect(teacher.locator('option[value="GLOBAL"]')).toHaveJSProperty('disabled', false);
  await teacher.context().close(); await admin.context().close();
});
test('publishes a global exam with education, department, and student filters', async ({ browser }) => {
  const page = await signIn(browser, 'teacher'); await page.goto('/exams/create');
  await page.getByLabel('Assessment scope').selectOption('GLOBAL');
  await page.getByRole('checkbox', { name: 'School', exact: true }).check();
  await page.getByLabel('Departments or study streams (comma separated)').fill('Science');
  await page.getByPlaceholder('Search by name or student ID').fill('School Learner');
  await page.getByRole('checkbox', { name: /^School Learner/ }).check();
  await page.getByPlaceholder('যেমন: কম্পিউটার সায়েন্স ও ডেটা স্ট্রাকচার পূর্ণাঙ্গ মডেল টেস্ট').fill('Targeted School Mathematics');
  await page.locator('#question-card-0 textarea').first().fill('What is two plus two?');
  const options = page.locator('#question-card-0 input[placeholder^="অপশন"]');
  for (const [index, answer] of ['4', '3', '2', '1'].entries()) await options.nth(index).fill(answer);
  await page.screenshot({ path: 'audit-local/targeted-exam-form.png', fullPage: true });
  await page.locator('button[type="submit"]').click(); await expect(page).toHaveURL(/\/exams$/);
  await expect(page.getByText('Targeted School Mathematics', { exact: true })).toBeVisible();
  examUrl = (await page.getByRole('article', { name: 'Targeted School Mathematics' }).getByRole('link').getAttribute('href')) || '';
  expect(examUrl).toMatch(/^\/exams\/[a-f0-9]{24}$/);
  await page.context().close();
});
test('only the selected school student sees the exam banner and direct page', async ({ browser }) => {
  const eligible = await signIn(browser, 'school'); await eligible.goto('/');
  await expect(eligible.getByText('Targeted School Mathematics', { exact: true })).toBeVisible();
  await eligible.goto(examUrl); await expect(eligible.getByText('Targeted School Mathematics', { exact: true }).first()).toBeVisible();
  for (const key of ['college', 'otherSchool']) {
    const outsider = await signIn(browser, key); await outsider.goto('/exams');
    await expect(outsider.getByText('Targeted School Mathematics', { exact: true })).toHaveCount(0);
    await outsider.goto(examUrl);
    await expect(outsider.getByText('This exam is unavailable for your enrollment or audience profile.', { exact: true })).toBeVisible();
    await expect(outsider.getByText('Targeted School Mathematics', { exact: true })).toHaveCount(0);
    await outsider.context().close();
  }
  await eligible.context().close();
});
test('global contest approval is separate and publishes a university CSE contest', async ({ browser }) => {
  const teacher = await signIn(browser, 'teacher'); await teacher.goto('/contests/create');
  await expect(teacher.locator('option[value="GLOBAL"]')).toHaveJSProperty('disabled', true);
  await teacher.goto('/instructor/assessments'); await teacher.getByLabel('Request access for').selectOption('CONTEST');
  await teacher.getByLabel('Teaching purpose and intended audience').fill('A university programming contest for the CSE department.');
  await teacher.getByRole('button', { name: 'Submit application' }).click();
  await expect(teacher.getByText('PENDING', { exact: true })).toBeVisible();
  const admin = await signIn(browser, 'admin'); await approve(admin, 'contest');
  await teacher.goto('/contests/create'); await teacher.getByLabel('Assessment scope').selectOption('GLOBAL');
  await teacher.getByRole('checkbox', { name: 'University', exact: true }).check();
  await teacher.getByLabel('Departments or study streams (comma separated)').fill('CSE');
  await teacher.getByLabel('Contest title').fill('Targeted CSE Contest');
  await teacher.getByLabel('Description and participation instructions').fill('A temporary workflow verification contest.');
  const localTime = (delta: number) => new Date(Date.now() + delta + 6 * 3600000).toISOString().slice(0, 16);
  await teacher.getByLabel('Starts (your local time)').fill(localTime(-60000));
  await teacher.getByLabel('Ends (your local time)').fill(localTime(3600000));
  await teacher.getByLabel('Title', { exact: true }).fill('Addition');
  await teacher.getByLabel('Question (LaTeX supported)').fill('What is two plus two?');
  for (let i = 1; i <= 4; i++) await teacher.getByLabel(`Option ${i}`, { exact: true }).fill(String(5 - i));
  await teacher.getByRole('button', { name: 'Publish contest' }).click(); await expect(teacher).toHaveURL(/\/contests\/targeted-cse-contest-/);
  contestUrl = new URL(teacher.url()).pathname;
  await teacher.context().close(); await admin.context().close();
});
test('university CSE students see the contest while EEE students cannot access it', async ({ browser }) => {
  const eligible = await signIn(browser, 'university'); await eligible.goto('/');
  await expect(eligible.getByText('Targeted CSE Contest', { exact: true })).toBeVisible();
  await eligible.goto(contestUrl); await expect(eligible.getByText('Targeted CSE Contest', { exact: true }).first()).toBeVisible();
  const outsider = await signIn(browser, 'outsider'); await outsider.goto('/contests');
  await expect(outsider.getByText('Targeted CSE Contest', { exact: true })).toHaveCount(0);
  await outsider.goto(contestUrl);
  await expect(outsider.getByRole('heading', { name: '404', exact: true })).toBeVisible();
  await expect(outsider.getByText('Targeted CSE Contest', { exact: true })).toHaveCount(0);
  await eligible.context().close(); await outsider.context().close();
});
test('superadmin can assign an existing course to another approved instructor', async ({ browser }) => {
  const admin = await signIn(browser, 'admin'); await admin.goto('/admin/assessments');
  await admin.getByRole('combobox', { name: 'Course', exact: true }).selectOption(fixture.courses.foreign);
  await admin.getByLabel('Instructor email').fill(fixture.users.teacher.email);
  await admin.getByRole('button', { name: 'Grant course access' }).click();
  await expect(admin.getByText('Instructor can now create assessments for this course.')).toBeVisible();
  const teacher = await signIn(browser, 'teacher'); await teacher.goto('/exams/create');
  await expect(teacher.getByRole('combobox', { name: 'Course', exact: true }).locator('option', { hasText: 'Other Instructor Course' })).toHaveCount(1);
  await admin.context().close(); await teacher.context().close();
});

test('course exams stay limited to enrolled students', async ({ browser }) => {
  const teacher = await signIn(browser, 'teacher'); await teacher.goto('/exams/create');
  await teacher.getByRole('combobox', { name: 'Course', exact: true }).selectOption(fixture.courses.published);
  await teacher.getByPlaceholder('যেমন: কম্পিউটার সায়েন্স ও ডেটা স্ট্রাকচার পূর্ণাঙ্গ মডেল টেস্ট').fill('Enrolled Course Assessment');
  await teacher.locator('#question-card-0 textarea').first().fill('What is two plus two?');
  const options = teacher.locator('#question-card-0 input[placeholder^="অপশন"]');
  for (const [index, answer] of ['4', '3', '2', '1'].entries()) await options.nth(index).fill(answer);
  await teacher.locator('button[type="submit"]').click(); await expect(teacher).toHaveURL(/\/exams$/);
  const url = await teacher.getByRole('article', { name: 'Enrolled Course Assessment' }).getByRole('link').getAttribute('href');
  const enrolled = await signIn(browser, 'university');
  expect((await enrolled.goto(url!))?.status()).toBe(200);
  await expect(enrolled.getByText('Enrolled Course Assessment', { exact: true }).first()).toBeVisible();
  const outsider = await signIn(browser, 'school');
  await outsider.goto(url!);
  await expect(outsider.getByText('This exam is unavailable for your enrollment or audience profile.', { exact: true })).toBeVisible();
  await teacher.context().close(); await enrolled.context().close(); await outsider.context().close();
});

test('student education profile changes immediately update targeted eligibility', async ({ browser }) => {
  const page = await signIn(browser, 'school'); await page.goto('/student/settings');
  await expect(page.getByRole('combobox', { name: 'Education level', exact: true })).toHaveValue('SCHOOL');
  await page.getByLabel('Department or study stream', { exact: true }).fill('Humanities');
  await page.getByRole('button', { name: /পরিবর্তন সংরক্ষণ করুন|Save Changes/ }).click();
  await expect(page.getByText(/প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে|Profile details updated successfully/)).toBeVisible();
  await page.goto('/exams'); await expect(page.getByText('Targeted School Mathematics', { exact: true })).toHaveCount(0);
  await page.goto(examUrl); await expect(page.getByText('This exam is unavailable for your enrollment or audience profile.', { exact: true })).toBeVisible();
  await page.context().close();
});
