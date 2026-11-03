# Selenium and unit test results

Executed on 29 October 2026 (Asia/Dhaka).

| Suite | Passed | Failed | Blocked |
| --- | ---: | ---: | ---: |
| Selenium WebDriver | 27 | 1 | 4 |
| Vitest unit tests | 369 | 0 | 0 |

Selenium 4.51.0 used Chrome and ChromeDriver 156.0.8078.73. Unit tests passed across 50 files. Production build, TypeScript and lint error checks passed. The Selenium suite ran with real UI/server/database behavior; unit tests use jsdom and mocks. The earlier 69-case Playwright/action report remains separate.

The Selenium login form exposed an email-normalization defect. The one-line fix preserves hyphens in email addresses while still cleaning phone formatting. Two new unit regressions and the Selenium wrong-password check verify the correction.

## Execution and cleanup

Run the isolated build, `npm run test:selenium`, and `npm run test:unit`. See `scripts/test-selenium.mjs`. Selenium sessions are prepared through real credentials endpoints; full delivered OTP login remains blocked. The runner uses a disposable database and a temporary generated PDF, checks its cleanup targets and deletes both. No real project accounts, courses, payments or Bunny records were modified.

The suite is a serial end-to-end journey, with related plan IDs in the CSV. These 32 dispositions do not claim all 69 original cases were individually rerun in Selenium.

## Open Selenium failure

SEL-23 opened the enrolled PDF modal, but browser fetch returned empty HTTP 204. Direct HTTP returned 200 and valid PDF bytes. An earlier focused run passed; the final complete run reproduced the failure. Root cause remains unconfirmed. PDF viewer/delivery reliability needs investigation.

## Blocked checks

- SEL-X01: No configured SMS provider and controlled receiving phone. No SMS was sent; fixture session setup does not verify OTP delivery.
- SEL-X02: No team-controlled Google consent session. Provider signup/login and cancellation require interactive account-holder access.
- SEL-X03: Fixture role sessions are verified; real account-holder sessions were not provided and no credentials were reset.
- SEL-X04: This Selenium run used desktop Chrome only. No physical mobile browser was connected; earlier emulation results are separate.

Live Bunny playback/token tests are retained in the earlier report under their original method, not counted as new Selenium passes. Public PDF URL secrecy, payment settlement, independent security certification, load and physical-device coverage remain outside this result.

## Submission artifacts

- `output/docx/e-Sikho_Selenium_and_Unit_Test_Results.docx`
- `output/docx/e-Sikho_Selenium_Test_Results.csv`
- `output/docx/e-Sikho_Unit_Test_Results.csv`
- `output/docx/e-Sikho_Selenium_Unit_Evidence.json`
- `output/docx/e-Sikho_Selenium_JUnit.xml`
- `output/docx/e-Sikho_Unit_JUnit.xml`
