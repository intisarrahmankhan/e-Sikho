# Test fix verification

The later [Selenium and unit results](SELENIUM_AND_UNIT_TEST_RESULTS.md) record 27 Selenium passes, one open PDF browser failure, four external blockers and 369 passing unit tests. The results below retain the earlier execution method and date; they are not Selenium counts.

Retested on 29 October 2026 (Asia/Dhaka), using the working tree on `main` at `0737cb19640f826390dba2b457971217d9eab6bf`. Fixes are local and uncommitted. The original execution report is retained.

The latest disposition is **65 Pass, 0 Fail, 4 Blocked** across the 69 planned cases. Execution used headless Chrome, authenticated real Next.js actions, and disposable MongoDB databases. These results are agent-assisted verification, not independent human manual execution. Separate unit tests use mocks.

## Focused fixes

| Original defect | Change | Verification |
| --- | --- | --- |
| BUG-01 / COURSE-01 | Missing instructor images use a neutral local avatar placeholder. | Instructor with no image/public instructor profile created a real course/module/lesson in the disposable database; ownership and reopened curriculum passed. |
| BUG-02 / UI-03 | MCQ choices use native buttons, keyboard focus and `aria-pressed`. | Tab reached choices; Space/Enter selected and changed answers; returning from the submit dialog preserved selection. |
| BUG-03 / DATA-01 | Removed invented 30/45-minute and 67% progress, default course completion dates and fabricated minimum course progress. | Empty home/catalog/dashboard/leaderboard/exam/contest pages showed no historical sample content; the dashboard no longer showed 67%. Course cards use actual lesson/routine progress. |

Revision requests now stay **PENDING** without unlocking content. The course owner reviews them at `/instructor/revision-requests`; administrators review them at `/admin/revision-requests`. Approval grants the course’s configured revision period and retains the existing student approval notification. Rejection requires feedback. Unrelated instructors, including instructors assigned only to host course assessments, cannot approve another owner’s requests. An expired revision grant relocks the content.

The exam introduction now distinguishes a cooldown from reaching the attempt limit. The 24-hour rule was retained. In a disposable database only, submissions aged by 25 hours verified the second attempt and final cap; the real clock and project records were unchanged.

The PDF check used a genuine temporary copy of the existing test-plan PDF. Resource entitlement checks, valid PDF delivery and opening the view-only modal passed. The temporary file was deleted. This does not certify secrecy of underlying public file URLs.

## Real video verification

At the user’s request, testing used an educational excerpt from [NASA’s Newton’s laws lesson](https://science.nasa.gov/eclips/videos/newtons-laws-on-board-the-international-space-station/), 00:30–00:50, downscaled to 507,541 bytes for the existing multipart request limit. NASA is credited as the source; no endorsement is implied. [NASA media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) permits educational/informational use subject to its stated conditions.

The instructor lesson-editor upload to library 792504 reached finished encoding status 4. The saved library/video reference survived reload. Desktop Chrome decoded and played protected media; pause, seek, volume, fullscreen and reopening passed. Unauthorized app sessions received no playback URL. HLS responses declared encryption and no MP4 fallback response was observed.

Tampered and expired tokens displayed a denial with no video element. Bunny’s denial page returned HTTP 200 with visible `403`, so HTTP status alone was not treated as success. The existing signing function issued a 15-second QA token for an actual expiry wait. The normal four-hour TTL and real clock were unchanged; the full four-hour period was not waited.

Mobile Chrome emulation played the stream. Physical mobile behavior remains unverified. These observations do not certify all DRM properties or prevention of screen recording. Each temporary Bunny upload was deleted; the final upload’s absence was confirmed by HTTP 404. Test courses were never inserted into the real project database.

## Remaining blocked cases

| Case | Required input |
| --- | --- |
| AUTH-03 / TC-M03 | A configured SMS provider and a controlled phone for delivered signup OTP and duplicate-registration checks. Set provider credentials locally; do not put secrets in reports. |
| AUTH-08 / TC-M08 | A team-controlled Google account/consent session for real OAuth login, role preservation and cancellation. |
| DATA-02 / TC-M62 | Interactive login by the real owner and existing Test Admin. Earlier read-only review preserved both approved accounts and found no historical sample candidates. No credentials were reset. |
| VIDEO-06 / TC-M54 | A physical mobile browser for playback and protection checks. Desktop and Android Chrome emulation passed; independent encryption/security certification is outside this test. |

## Supporting checks and artifacts

Production build, TypeScript, lint error checks, **367 unit tests across 49 files**, and **8 authenticated assessment workflows** passed. Existing nonfatal framework/Mongoose warnings remain. All disposable databases and temporary public PDFs were removed.

- Editable report: `output/docx/e-Sikho_Test_Plan_Retested.docx`
- All 69 outcomes and timestamps: `output/docx/e-Sikho_Test_Retest_Results.csv`
- Sanitized evidence: `output/docx/e-Sikho_Test_Retest_Evidence.json`
- Original report: `output/docx/e-Sikho_Test_Plan_With_Results.docx`
- New revision regression suite: `__tests__/unit-testing/RevisionAccess.test.ts`

`audit-local` contains ignored diagnostic logs. Do not publish raw sessions or provider responses without review. The deployment issues recorded in `PROJECT_AUDIT.md`, including unsafe in-process code grading and the missing payment-provider integration, remain outside these focused fixes. Required blocked cases still prevent full sign-off.
