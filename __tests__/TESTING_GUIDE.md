# Testing Guide for e-Sikho

This document contains the commands to run different types of tests in the project.

## 1. UI / End-to-End Testing (Playwright)
UI tests are located in `__tests__/ui-testing/`. They launch a real browser and simulate user interactions.
- **Run all UI tests:** `npx playwright test`
- **Run a specific UI test file:** `npx playwright test __tests__/ui-testing/<filename>.spec.ts`
- **Run UI tests in UI mode (interactive):** `npx playwright test --ui`

## 2. Unit Testing (Vitest/Jest)
Unit tests are located in `__tests__/unit-testing/`. They test isolated components and functions quickly.
- **Run all unit tests once:** `npm run test:unit`
- **Run a specific unit test:** `npx vitest __tests__/unit-testing/<filename>.test.ts`
- **Run tests with the browser dashboard:** `npm run test:unit:ui`
- **Open one test file in the browser dashboard:** `npm run test:unit:ui -- "__tests__/unit-testing/<filename>.test.ts"`

The browser dashboard displays test files, individual tests, progress, and results. It stays in watch mode while open, so rerun tests in the dashboard after changing code. Stop it with `Ctrl+C` in the terminal.

For the admin status test currently in this project, run:

```powershell
npm run test:unit:ui -- "__tests__/unit-testing/admin- status.test.ts"
```

The `--open` option opens the Vitest dashboard automatically. If it does not open a browser in your environment, use the local URL printed in the terminal.

## 3. Integration Testing
Integration tests are located in `__tests__/integration-testing/`. They test how different modules (like API routes and Database) work together.
- **Run all integration tests:** `npx vitest __tests__/integration-testing/`
