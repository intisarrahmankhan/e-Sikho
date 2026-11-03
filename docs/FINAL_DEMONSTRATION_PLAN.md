# e-Sikho final demonstration readiness

Reviewed on 3 November 2026, Asia/Dhaka. This review covers the current local working tree and preserves earlier reports as historical evidence.

The project already has enough core functionality for a professional academic demonstration. Finish data integrity, access control and reliability before freezing the release. Approve a small final feature scope rather than expanding every module. The application is not ready for complete acceptance yet.

## Recommended final additions for approval

These additions are proposals; they have not been implemented in this review.

| Priority | Addition | Demonstrable result | Acceptance conditions |
| --- | --- | --- | --- |
| 1 | Server-managed exam attempts and answer recovery | A learner reloads or reconnects without losing answers; the server enforces the same deadline. | Server-generated attempt ID and deadline; authorized answer saves; recovery after reload; late submissions rejected or finalized by policy; duplicate final submissions cannot create extra results. |
| 2 | Instructor assessment results and CSV export | The instructor reviews real participants, marks, attempts and pass rate for an owned or assigned assessment. | Course/assessment ownership checks; eligible participant filtering; actual submission aggregates; an empty state; correctly escaped CSV export. |
| 3 | Genuine completion certificates with verification | A qualifying learner receives a uniquely identifiable certificate that an examiner can verify. | Define completion/pass rules first; issue once per qualifying learner/course; a verification page or QR link; revoke/reissue policy; no certificate claimed from a passed exam attempt alone. |

Implement priorities 1 and 2 first. Certificates are optional if submission time is tight. Saved assessment drafts/editing are a secondary usability improvement. A payment gateway, AI features and a broad redesign are unnecessary for a free-course demonstration unless explicitly required by the assessment.

## Core demonstration already implemented

- Instructor course/module/lesson creation and published course discovery.
- Free enrollment, protected Bunny playback and persisted lesson progress.
- Global exam/contest hosting applications and superadmin approval.
- Education level, department and selected-student audience restrictions.
- MCQ scoring, fractional negative marking, attempt caps and cooldown presentation.
- Revision-access requests and owner/admin review.
- Discussions, live Q&A, role boundaries and Bangla/English interfaces.

These are implemented workflows, not a claim that every provider/device path has passed final manual testing.

## Focused changes completed in this review

### Loading and navigation

| Area | Change | Verification |
| --- | --- | --- |
| Course catalog | Start catalog, recommendations and wishlist reads together. Remove module/lesson reads from cards that only use course metadata. | Regression tests cover 1 and 100 courses with no curriculum reads, and a catalog query starting while recommendations are pending. Instructor population and personalization still perform their own required reads. |
| Course learning tabs | One server action computes entitlement once and shares that server-derived result with resource/live-session loaders. | One authentication/entitlement read per combined request; private PDFs and meetings remain withheld; authorization is not reused across viewers. |
| Course metadata | Fetch all lessons for the course's module IDs in one batch and preserve module/lesson ordering. | One lesson query with 100 modules; an empty course invents no lessons; private media URLs remain omitted from lesson metadata. |
| Student dashboard | Run independent sections concurrently and retain successful sections if another section fails. | Production build and automated regression run pass these flows. |
| Course interface | Load secondary tabs and modals on demand; load the PDF component when opened. Use stable session keys and cancel obsolete metadata fetches. Clear previous course/access/media state when the course or viewer changes. | Unit checks and Selenium course/progress workflows; PDF delivery remains the separate open failure below. |
| Exam catalog | Load the optional formula playground when requested. | Production bundle output; the formula feature remains available through its link/button. |
| Administrator navigation | Use valid admin dashboard links and hide student-only goals/settings shortcuts for administrators. | TypeScript, lint and build checks. |

Current production First Load JS: `/exams` **129 kB**, `/courses/[id]` **154 kB**. The saved 29 October build reported 208 kB and 163 kB respectively. Those saved builds are useful context, not a controlled before/after page-latency benchmark. No percentage improvement in real navigation time is claimed. Database location, network latency, page data size and development compilation still affect observed speed.

For the demonstration, use a production build:

```powershell
npm run build
npm start
```

`npm run dev` and the current `npm run server` both run development mode. Measure first visits and repeated transitions separately. Record click-to-visible-content time on the final deployment and the same network/device, including authenticated course and dashboard transitions.

The reported slowdown was confirmed to occur under `npm run dev`. Removed the custom memory-only Webpack cache override, restoring Next.js 14's complete default compiler-cache configuration. An isolated development smoke check returned HTTP 200 for home and login before and after a restart, with compiler cache files created on disk. First server requests took about 6.1 seconds for login and 4.3 seconds for home; immediate repeats took 0.09 and 0.11 seconds. Restart requests still included about 6.0 and 4.3 seconds of route compilation, so this check does not establish a restart speed improvement. These are server-request timings for two routes, not browser transition measurements or a production benchmark. Initial route compilation remains expected in development; use the production build for the demonstration. Evidence: `audit-local/dev-cache-check`.

### Data integrity and truthful UI

- Removed invented admin totals/revenue and fallback contest participant counts. A failed admin data load displays an unavailable-data notice.
- Removed fake rating/review/enrollment values from recommendations and wishlists. Published, approved courses are required for recommendations.
- Removed invented instructor qualifications, experience, background, skills and expertise defaults. Real values supplied by instructors remain intact.
- The pending instructor queue displays real legacy requests without creating profiles during page reads. Authorized review remains the point where a legacy request can create its real profile.
- Replaced unrelated instructor portrait fallbacks with a neutral local placeholder in the course catalog/details.
- Corrected the student metric to **Passed Exam Attempts**, matching its actual source. Removed unsupported verified-certificate promises; certificate issuance is proposed above.

This is a focused source correction, not a certification that every historical record or every remaining fallback is genuine.

## Issues to resolve before the final freeze

| Area | Current finding | Required resolution |
| --- | --- | --- |
| Enrolled-course progress | `actions/student-actions.ts` still initializes one enrolled-course path to 25% and invents a target completion date. | Use real lesson/routine completion and an actual saved target date; otherwise show zero/no target. |
| Study planner | `lib/routine-scheduler.ts` can invent 24 lessons, estimated completed lessons, weekly live classes and midterm/final exams. The goals page also assumes 24 lessons. | Schedule actual curriculum and actual saved events only. Empty curriculum needs an empty state. Do not represent a suggested study activity as a real instructor event. |
| Project submission authorization | Enrollment lookup uses `status: 'ACTIVE'`, absent from the Enrollment schema. Lesson/course membership and course ownership checks are incomplete in submission/list/grading paths. | Reuse current entitlement rules, validate lesson membership and restrict instructor reads/grading to the course owner or explicitly permitted reviewer. |
| Project evaluation | URL strings and description keywords produce claims that GitHub repositories and live endpoints were verified. | Present these as preliminary input checks. Require actual instructor review or separately approved, genuine remote verification before awarding a trustworthy project grade. |
| Exam reliability | Browser storage/timers do not establish a server-enforced attempt deadline; failure during autosubmission can compromise answer recovery. | Implement proposal 1 before using strict timed assessments as a final-release claim. |
| PDF browser delivery | SEL-23 again received an empty HTTP 204 in Chrome after opening the PDF modal. Direct HTTP returned 200 with valid PDF bytes. | Investigate browser delivery and confirm readable pages in real desktop/mobile browsers. Keep the result failed until verified. |
| Real lecture uploads | The existing multipart server-action path is unsuitable for ordinary large lecture files; the previous upload test used a small excerpt. | Approve and verify a supported large/resumable provider upload path with real lecture files and server-issued authorization. |
| Paid checkout | Real payment-provider settlement is unavailable. | Keep the demonstration free-course based, or separately approve and implement a verified payment integration. |
| Deployment security | Production audit reports 1 critical and 2 high package findings, including installed Next.js 14.2.35. Student code also runs through an in-process VM. | Plan a controlled framework/auth dependency upgrade with regression testing. Use an isolated judge before accepting untrusted code. A major upgrade was not applied during these focused changes. |
| Documentation | README still describes the original admin-only Prisma branch rather than the current Mongoose application. | Update it for the approved final scope, setup, contributors and supported workflows before submission. |

The maintainer identifies a Windows-hosted remote-code-execution issue affecting this Next.js version: [Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36). Node explicitly does not treat its VM as a security boundary: [Node VM documentation](https://nodejs.org/api/vm.html#vm-executing-javascript).

## Existing database review and actual content

The fresh read-only review found **zero candidates across nine historical sample fingerprint collections** and zero linked matches. It made **zero database writes**. Existing accounts, including Intisar's account and the existing Test Admin superadmin, were untouched. This does not identify every arbitrary test record, copied title, fabricated credential or previously altered aggregate.

Before any existing-record cleanup, identify exact record IDs and dependencies, review them with the team, back up approved targets and use a reviewed cleanup transaction. A legitimate course or person can share a name with a former sample. No database deletion or automatic seeding occurred in this review.

Use a small, complete set of genuine content for the demonstration:

- One team-authored course with its actual title, description, syllabus, outcomes and prerequisites.
- Instructor-supplied name, biography, expertise and qualifications; missing fields remain empty.
- Two modules with genuine lessons, one licensed/owned lecture video and a real PDF.
- A short course exam with a reviewed answer key, marks and attempt policy.
- A global exam or contest with actual dates and deliberately chosen audience criteria.
- Team-controlled learner accounts with accurately supplied education level/department.
- Real enrollments, submissions, completion and reviews created through normal workflows. Leave ratings, revenue and certificates at zero until actual records justify them.

Do not use raw database insertion of invented enrollment/revenue/progress merely to make dashboards look busy. Keep automated test fixtures in disposable test databases.

## Final demonstration sequence

1. Show the genuine published course and instructor.
2. Open its actual curriculum and prepared lecture/PDF.
3. Submit and approve a global-hosting application.
4. Show the eligible learner's exam/contest banner, then demonstrate an excluded learner's denial.
5. Enroll in the free course, play protected media, complete a lesson and reload to prove persistence.
6. Submit a short known-answer MCQ exam and explain the actual marks and cooldown.
7. Demonstrate a student/admin or cross-course access boundary.
8. Show actual dashboard values, approved new reporting features and final test evidence.

Pre-upload lecture assets so encoding and network transfer do not consume the presentation. Use separate controlled browser profiles for roles.

## Verification on the current changes

| Check | Result |
| --- | --- |
| Unit tests | **381 passed, 0 failed, 53 files**. New coverage includes catalog/metadata query scalability, combined learning-read access boundaries, real zero statistics and side-effect-free instructor queue reads. |
| TypeScript | Passed. |
| ESLint error check | Passed. Existing framework image/hook warnings remain in the build log. |
| Production build | Passed in the isolated `.next-final-readiness` directory. |
| Selenium WebDriver | **27 passed, 1 failed, 4 blocked**. The open PDF failure was reproduced; no new passing claim replaces it. |
| Temporary Selenium data | Disposable test database and temporary PDF removed successfully. Real project database untouched by the suite. |
| Read-only sample review | Zero known historical matches; zero database writes. |
| Production dependency audit | 1 critical, 2 high; upgrade decision pending. |

Selenium's four external blockers are delivered SMS/OTP, real Google consent, real owner/Test Admin interactive login and physical-mobile protected playback. Fixture sessions do not prove delivered OTP or account-holder login. The older DOCX reports remain unchanged.

Evidence is in ignored `audit-local/final-readiness`: `unit-results.json`, `types.log`, `lint.log`, `build-final.log`, `selenium/results.json`, `dependency-audit.json` and the read-only dummy-data preview. Avoid publishing raw diagnostic records without review.

## Freeze and final manual testing

Agree on the final additions and close the relevant blockers first. Then upload approved actual content, review remaining sample candidates, record the release revision/build and freeze the scope. Reset final manual executions to **Not Run**; older automated evidence must retain its own execution method/date.

Run the retained 69-case plan against that frozen version, then add the approved new-feature cases. Cover the successful journey, invalid inputs, unauthorized roles, enrollment expiry, audience exclusions, duplicate submissions, reload/reconnect, empty data, database/provider failure, PDF/video playback, desktop/mobile and Bangla/English. Record expected/actual results, status, tester, date and evidence for every case. Fix failures, retest affected paths and rerun the automated regression suites before acceptance.

Efficiency acceptance needs actual timing and representative content. Record cold and repeated navigation, course/video/PDF loading and assessment submission on the intended deployment. Do not infer a measured efficiency percentage from unit passes or bundle sizes.

Implementation references: [Next.js parallel data fetching](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns), [Next.js lazy loading](https://nextjs.org/docs/14/app/building-your-application/optimizing/lazy-loading), [Server Action request limits](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).
