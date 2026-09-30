# E-Sikho Testing Instructions

Welcome to the testing documentation for the `e-sikho` platform! We have both Unit Testing and End-to-End (E2E) testing configured. This guide will show you how to run them and where to find the proof/results.

## 1. Unit Testing (Vitest)
We use Vitest along with React Testing Library to test individual UI components.

- **To run the unit tests:**
  ```bash
  npm run test
  # or use npx directly:
  npx vitest run
  ```
- **Where to find the tests:** `__tests__/` directory.
- **Where to store the proof:** When running tests for proof, update the `test-proof/unit-test-results.md` file.

## 2. End-to-End Testing (Playwright)
We use Playwright to simulate actual user journeys (like logging in, browsing courses, and enrolling) across multiple browsers (Chrome, Firefox, Safari/WebKit).

- **To run the E2E tests:**
  ```bash
  npx playwright test
  ```
  *(Note: Playwright is configured to automatically launch our Next.js dev server before testing, so you don't need to manually start it).*

- **To view the Interactive HTML Report:**
  Playwright generates a beautiful, interactive report after every run. To view it, run:
  ```bash
  npx playwright show-report playwright-proof/playwright-report
  ```

- **Where to find the tests:** `e-sikho-testing/` directory.
- **Where to store the proof:** Always copy your `playwright-report` into the `playwright-proof/` folder and update `playwright-proof/playwright-test-results.md`!
