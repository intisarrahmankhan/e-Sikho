# e-Sikho manual test plan

Prepared: 28 October 2026 (Asia/Dhaka).

This plan contains **69 manual test cases**: 29 P0, 37 P1, and 3 P2. It is a procedure for manual testing, not a claim that the manual tests have passed. Record a fresh result for each case in [MANUAL_TEST_RESULTS.csv](MANUAL_TEST_RESULTS.csv). Existing automated results are recorded separately in [ASSESSMENT_WORKFLOWS.md](ASSESSMENT_WORKFLOWS.md).

## 1. Test setup

1. Use a separate staging database and staging deployment for tests that create users, courses, submissions, or financial records. Confirm which database the running app uses before entering test content. Do not restore the retired sample dataset into the real project database.
2. Restart the development server once after the recent environment/model changes. For local testing run `npm run dev`; use the address printed by Next.js, normally `http://localhost:3000`.
3. Record the branch, commit, uncommitted-change status, app URL, browser/version, viewport, tester, and date/time. The current working changes are on `codex/project-audit`; a commit hash alone does not identify uncommitted changes.
4. Use separate browser profiles or private sessions for different roles. Do not share an authenticated session between the instructor and student during an access test.
5. Prepare the accounts and content below in staging. Use team-controlled accounts; keep passwords, OTPs, provider keys, tokens, and database connection strings out of screenshots and reports.
6. Open browser Developer Tools: Console and Network. For every failure, capture the visible error and relevant response with secrets removed.

### Accounts

These labels identify test roles; they are not built-in credentials or production sample accounts.

| Label | Role/profile | Purpose |
| --- | --- | --- |
| SA | Existing superadmin | Hosting reviews, course assignments, administration |
| AD | Ordinary admin, if available | Verify distinction between admin and superadmin |
| I1 | Approved instructor; owns course C1 | Course creation and global hosting |
| I2 | Approved instructor; initially owns no part of C1 | Assignment and ownership checks |
| S1 | Student: School, Science | Selected eligible school student |
| S2 | Student: School, Science | Same background, not explicitly selected |
| S3 | Student: College, Science | Education mismatch |
| S4 | Student: University, CSE | Eligible university student |
| S5 | Student: University, EEE | Department mismatch |
| S6 | Student with no education level/department | Missing profile and unrestricted audience |
| ANON | Signed out/private browser | Anonymous access |

### Content and known values

- C1: instructor I1's course, initially draft, with one preview lesson, one private lesson, one real small video you own, and one resource. Publish it when the relevant case instructs you to.
- C2: another course, used to check that C2 enrollment cannot unlock C1 content.
- Give S1 access to C1 using free published-course enrollment or an authorized staging enrollment. Keep S2 unenrolled. Give S4 access to C2 only. Paid checkout is currently unavailable.
- E1: course exam for C1. For reproducible scoring, use three MCQs worth 2 marks each, total 6, pass mark 2, negative deduction 0.25, maximum attempts 2. Keep a private answer key.
- GE1: global exam limited to School + Science + specifically S1.
- GC1: global contest limited to University + CSE, with no selected-student restriction. Set a short, valid start/end window and a duration inside that window.
- Separate exams may be needed for independent scoring tests: the current retake policy includes a 24-hour cooldown. Do not change the production clock or weaken the policy to finish testing.
- Record generated course IDs, exam IDs, contest slugs, and lesson IDs in the run record. Substitute them for `<courseId>`, `<examId>`, and `<slug>` below.

## 2. How to record results

Use **Not Run**, **Pass**, **Fail**, **Blocked**, or **N/A**. Mark Pass only after comparing the actual result with the expected result. Missing video/provider credentials, missing accounts, or missing setup records mean Blocked, not Pass. Give a reason for N/A.

P0 = authorization/data protection; P1 = main workflow; P2 = usability/regression. Run P0 and P1 first. Cases with multiple checks pass only when every listed check passes. For an access denial, a redirect, not-found page, or clear permission error can be acceptable; protected content must never be included in the response. An HTTP 200 alone does not prove access was granted or denied.

## 3. Authentication and roles

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| AUTH-01 | P1 | S1 | Open `/login?tab=login`; sign in using the account's supported password/OTP flow; open the student dashboard; reload. | Correct identity and role persist; no other user's data appears. |
| AUTH-02 | P0 | ANON | Try a wrong password, nonexistent account, and an incomplete OTP flow. | Authentication fails; no dashboard session or automatic replacement account is created. |
| AUTH-03 | P1 | New staging student | Use signup at `/login`; request OTP; try an incorrect OTP, then complete with the valid OTP. Attempt the same registration again. | Incorrect OTP cannot register; valid flow creates one account; duplicate registration does not create a second identity. Real SMS delivery is Blocked if the provider is unavailable. |
| AUTH-04 | P0 | ANON | Open `/student`, `/instructor`, `/admin`, and `/payment/<courseId>` directly. | Sign-in required; no protected dashboard or payment data is returned. |
| AUTH-05 | P0 | S1, I1, AD | As S1, open `/instructor`, `/exams/create`, `/contests/create`, `/admin`; as I1 and AD, open `/admin/assessments`. | Students cannot author/administer; instructors and ordinary admins cannot review superadmin hosting applications. |
| AUTH-06 | P0 | S1 | Sign out; revisit the dashboard through Back and reload; try a protected action again. | No protected action succeeds with the signed-out session; reload requires authentication. |
| AUTH-07 | P0 | SA + staging account | Block/suspend a disposable account using moderation; refresh its existing session and try a protected action. | Blocked/suspended account cannot continue protected use. Preserve the real owner and administrator accounts. |
| AUTH-08 | P1 | Existing Google-linked account | If OAuth is configured, sign in with Google; verify identity and role; cancel a second Google sign-in. | Existing role/status retained; cancellation produces useful feedback. Blocked if OAuth is not configured. |

## 4. Courses, enrollment, and ownership

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| COURSE-01 | P1 | I1 | Create C1 at `/instructor/create-course`; save required fields, module, and lesson; reopen the editor. | Saved content persists under I1 with no unrelated sample content added. |
| COURSE-02 | P0 | ANON, S1 | While C1 is draft, search `/courses`, open its direct URL, and inspect `/api/courses/<courseId>`. | Draft content is withheld from public users; it cannot be enrolled in as a published course. |
| COURSE-03 | P1 | I1, ANON | Publish C1 through the existing course workflow; search the catalog and open its detail page. | Correct title/details appear; course links resolve to the saved course. |
| COURSE-04 | P0 | ANON, S2 | Open C1 without enrollment; try the preview and private lesson; inspect public metadata response. | Only explicitly public preview content is available; private lesson media URLs are absent from public metadata. |
| COURSE-05 | P1 | S1 | Enroll in published free C1; reload dashboard and course page; repeat enrollment. | C1 appears in enrolled courses; authorized content opens; duplicate enrollment does not duplicate the course entry. |
| COURSE-06 | P0 | I2 | Open I1's curriculum editor by URL; try editing or deleting C1 modules/lessons if controls are accessible. | Unauthorized mutation is denied; I1's content remains unchanged. |
| COURSE-07 | P0 | S4 | With access to C2 only, attempt C1 private playback/resource URLs through the app. | C2 access never unlocks C1 content. |
| COURSE-08 | P1 | S1 | Complete a real lesson using its supported completion control; reload and reopen dashboard/course. | Completion persists for that student and course; progress reflects real completion, not elapsed page-open time. |
| COURSE-09 | P1 | SA + S1 | In staging, prepare expired enrollment/course access; check private lessons and E1. If revision access is offered, request it and use the existing approval workflow; check before and after expiry. | Expired access is denied; a request alone does not grant access; approved, unexpired revision access restores eligible access; expired revision access removes it. Blocked if the setup/approval interface is unavailable. |

## 5. Instructor hosting applications and course assignments

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| HOST-01 | P1 | I1 | Before global approval, open `/exams/create` and `/contests/create`; inspect Assessment scope and Course. | Course selector is visible; owned draft/published courses are listed; global option requires approval. |
| HOST-02 | P1 | I2 | Before assignment, open both creation forms with no owned courses. | Clear empty-course guidance appears; no course is silently selected and global access is not automatically granted. |
| HOST-03 | P1 | I1 | At `/instructor/assessments`, choose Global exams; try a reason shorter than 20 characters, then a valid 20–2000 character reason; submit. | Short reason rejected; valid application becomes PENDING; hosting remains locked pending review. |
| HOST-04 | P1 | I1 | Reload the application page and try submitting the same pending type again. Repeat after approval later. | No duplicate pending/approved request for the same instructor and type. |
| HOST-05 | P0 | SA, I1 | SA opens `/admin/assessments`, verifies I1/reason/type, and approves EXAM. I1 reloads both creation forms. | EXAM application is APPROVED; global exam publishing unlocks; global contest remains locked. |
| HOST-06 | P1 | I1, SA | Apply for CONTEST. SA tries rejecting without sufficient notes, then rejects with at least 10 characters of feedback. | Insufficient rejection feedback rejected; valid rejection saved and visible to I1; global contest stays locked. |
| HOST-07 | P1 | I1, SA | Resubmit the rejected CONTEST application with a revised purpose; approve it; refresh contest creation. | Application returns to PENDING before review; approval unlocks global contests independently. |
| HOST-08 | P1 | SA, I2 | In `/admin/assessments`, use Assign course assessment access for C1 and I2's approved-instructor email; I2 reloads both builders. | C1 is selectable for I2's assessments; course ownership is unchanged. This grants assessment authoring, not general curriculum editing rights. |
| HOST-09 | P0 | SA, I2 | Try assignment to a nonexistent email or student email. As I2, try accessing assignment/review controls. | Invalid instructor assignment rejected; instructor cannot grant themselves access or approve hosting. |

## 6. Audience filtering and student profiles

Run AUD-02 through AUD-07 for both an exam and a contest. Check the homepage banner, `/exams` or `/contests`, the direct detail/arena URL, and participation where applicable. Repeat after a reload to avoid relying on stale client state.

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| AUD-01 | P1 | S1–S6 | In `/student/settings`, save the education/department values from the setup table; reload. Leave S6 unset. | Actual values persist; missing values do not become an invented University/CSE profile. |
| AUD-02 | P0 | I1, S1–S3 | Publish GE1 as School + Science + specifically S1; visit all visibility/access surfaces as S1, S2, S3. | S1 sees and participates; S2 is excluded despite matching background; S3 is excluded by level and student selection. |
| AUD-03 | P0 | I1, S4, S5 | Publish GC1 as University + CSE; leave selected students blank. | S4 sees/participates during the contest window; S5 has neither banner visibility nor direct participation access. |
| AUD-04 | P0 | I1, S1, S3, S4 | Publish an assessment for School OR College, department Science, no specific students. | S1 and S3 qualify; S4 does not. Values within one filter are OR; different filter groups are AND. |
| AUD-05 | P0 | I1, S6, ANON | Publish a global assessment with all audience filters blank; open as S6 and ANON. | Registered S6 is eligible despite missing education details; anonymous viewers cannot access the assessment. |
| AUD-06 | P1 | S4 | Set department to ` cse `, then `Computer Science & Engineering (CSE)`; recheck GC1. | CSE normalization gives consistent eligibility despite case/spacing/recognized expanded label. |
| AUD-07 | P0 | S1 | After GE1 loads, change S1's department to Arts in another tab; refresh lists and try the old direct link/submission. Restore Science afterward. | Newly requested protected reads/submissions are denied after eligibility changes; old client state cannot grant access. |
| AUD-08 | P1 | I1 | In the global audience builder, search a real student's name; select/remove the result and save. Search text with no matches. | Only actual selectable student accounts appear; selected ID persists; removal updates eligibility; no-match state is useful and does not insert a fabricated user. |

## 7. Exam creation, taking, and scoring

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| EXAM-01 | P1 | I1 | At `/exams/create`, create E1 for C1 using the known scoring values; reopen its page. | Builder starts with an empty question; course association, question order, totals, duration, pass mark, and attempts match saved input. |
| EXAM-02 | P1 | I1 | Try empty title/question, fewer than 2 MCQ options, a blank option, no correct answer, zero marks, pass mark above total, duration outside 1–480, and fractional/above-50 attempt limit. | Invalid inputs are blocked with feedback; no malformed exam is saved. Test each input separately. |
| EXAM-03 | P0 | I1, S1, S2 | Create an exam while C1 is draft; try as students. Publish C1; repeat as enrolled S1 and unenrolled S2. | Instructor can prepare the draft-course assessment; students require a published course and current entitlement. |
| EXAM-04 | P1 | S1 | On E1, answer one 2-mark MCQ correctly, one incorrectly, and skip one; submit. | Total 6; earned 2 minus 0.25 = 1.75; correct/wrong/skipped counts 1/1/1; 29% after rounding; Fail against pass mark 2. Blank answer receives no deduction. |
| EXAM-05 | P1 | Eligible student | On a separate equivalent exam, disable negative marking; submit the same pattern. On another, answer all incorrectly with negative marking enabled. | No-negative score is 2/6; all-wrong score is floored at 0; score never becomes negative. |
| EXAM-06 | P1 | S1 | Submit E1; try again immediately; reload history. After the 24-hour cooldown, use the remaining attempt, then try exceeding 2 attempts. | Cooldown enforced; attempt history persists; maximum-attempt limit is enforced. Until the cooldown passes, record the final portion Blocked rather than assuming success. |
| EXAM-07 | P1 | I1, eligible student | Create True/False and short-answer questions with a known accepted answer. Take them using correct/incorrect responses; inspect the result. | Correct question types render; scores and explanations match the answer key. For CODE, run only a benign known-answer example in isolated staging; unsafe code execution remains a deployment blocker. |
| EXAM-08 | P0 | Eligible student | Before submission, inspect the normal exam page and its Network responses; try any visible preview route/control. | Unsubmitted student cannot obtain correct answers, accepted-answer lists, explanations that reveal answers, or hidden code test cases through preview flags. |
| EXAM-09 | P1 | Eligible student | Start a separate short-duration exam; let the visible timer expire. Record submit/timeout behavior and then reload the page. | UI follows its advertised timeout/submission behavior without freezing or presenting an extra attempt as the same attempt. This checks browser behavior only; server-enforced exam elapsed-time guarantees need a separate review. |

## 8. Contest creation, timing, and participation

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| CONTEST-01 | P1 | I1 | At `/contests/create`, publish a permitted course/global MCQ contest with real questions and dates; open its detail page. | Saved content, scope, audience, duration, dates, and unique URL are correct; no sample problems appear. |
| CONTEST-02 | P1 | I1 | Try end before start, an already-ended window, duration longer than the window, and invalid/empty questions. | Creation rejected with useful feedback; no invalid contest published. |
| CONTEST-03 | P0 | Eligible student | Visit the contest before start, during the window, and at/after end. Try submitting outside the window. | Upcoming/Live/Ended derives from actual times; submissions outside the window are denied by the server. Record times in Asia/Dhaka. |
| CONTEST-04 | P1 | Eligible student | Submit known correct and incorrect MCQ answers during the live window; reopen results/history and any leaderboard. | Result matches the answer key; submission belongs to the correct student/contest; participation/ranking reflects real submissions. Record duplicate-submit behavior for review. |
| CONTEST-05 | P0 | Eligible student | Inspect active contest Network responses for solutions, then revisit home/catalog after contest ends. | Active solutions are withheld; ended contest leaves the homepage banner but remains in the eligible catalog. |

## 9. Video playback and protection

The configured Bunny library is **792504**. It was empty at the latest API verification. VIDEO-02 through VIDEO-06 need a real authorized video; mark them Blocked until one is uploaded and encoded. Use a small file first because the existing multipart upload path has a request-size limit; resumable large-file upload is proposed, not implemented.

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| VIDEO-01 | P0 | Bunny account owner | Inspect library Security settings without copying any keys. | Embed view token authentication enabled; Basic MediaCage DRM enabled; MP4 fallback disabled; original-file exposure and Early Play disabled. This is a configuration check, not proof of successful encrypted playback. |
| VIDEO-02 | P1 | I1 | Upload a small real lesson video through C1's lesson editor; inspect Bunny encoding status; reload the saved lesson. | Real video is created in the configured library; upload errors are explicit; stable saved reference survives reload; playable only after provider processing permits it. |
| VIDEO-03 | P1 | S1 | Play the private lesson in C1; pause, seek, adjust volume, enter/leave fullscreen, then reload. | Authorized playback works without unrelated fallback media or browser exceptions. Do not infer watched progress solely from an open iframe. |
| VIDEO-04 | P0 | S2, ANON | Open the private lesson through the app; repeat in private browsing and with access only to C2. | App does not issue playable private content to unauthorized viewers. A copied valid bearer embed URL may work until expiry; that alone does not prove the application access check failed. |
| VIDEO-05 | P0 | Tester | For a fresh signed Bunny embed URL, change one token character; separately retain a copy until its actual expiry, then load it in a new session. | Tampered and expired signed URLs cannot begin fresh playback; authorized app navigation can obtain a new valid URL. Do not publish the signed URL as evidence. |
| VIDEO-06 | P0 | Tester | Inspect Bunny playback/network behavior and compare with VIDEO-01 settings; test current desktop Chrome and one mobile browser. | Provider protection is active during working playback and no app MP4 fallback is exposed. Document only observed evidence; watermark, hidden download buttons, or iframe use alone do not prove encryption or prevent screen recording. External YouTube/Vimeo/public-file links are outside Bunny DRM coverage. |

## 10. Resources, live sessions, payments, and administration

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| EXTRA-01 | P0 | S1, S2, ANON | Open a private C1 PDF/resource through the app as each actor; also check an explicitly public preview resource. | Private resource requires C1 access; preview follows its configured policy; missing files do not open fabricated PDFs. Direct public-storage URLs have a known separate protection limitation. |
| EXTRA-02 | P0 | S1, S2 | Open a real C1 session at `/live/<sessionId>` and try viewing meeting/recording details. | Entitled student gets real configured session information; outsider does not receive protected meeting/recording details. Blocked if no real session is configured. |
| EXTRA-03 | P1 | S1, I1, I2 | During a staging live session, S1 submits a question; I1 answers/pins it; I2 tries the same management actions without ownership. | Real questions persist; owner can manage; unrelated instructor cannot answer/pin/complete I1's session. No preseeded questions appear. |
| EXTRA-04 | P0 | S1 | Open paid checkout at `/payment/<paidCourseId>`; inspect the unavailable state and any old saved success/result URL. | No simulated payment success or enrollment; no card/mobile PIN collection; client-controlled success links cannot grant access. Actual settlement/refund/payout verification is Blocked until a real provider is integrated. |
| EXTRA-05 | P0 | S1, I1, SA | Try direct access to `/admin/refunds`, `/admin/payouts`, `/admin/moderation`, `/admin/audit`; SA checks these pages with an empty staging dataset. | Nonadmins cannot perform privileged actions; allowed admin pages show actual records/empty states, without sample transactions. Do not treat an internal status change as proof that money moved. |
| EXTRA-06 | P1 | Student, SA | Use the student instructor-role application workflow; review it at `/admin/instructors/pending` with authorized reviewer; reauthenticate if required. | Real application and review state persist; pending student cannot use instructor privileges; approval gives the intended role without losing the original account. |

## 11. Dummy-data removal and general regression

| ID | Priority | Actor | Steps | Expected result |
| --- | --- | --- | --- | --- |
| DATA-01 | P1 | Tester | In a clean staging dataset with no authored content, open home, catalogs, dashboard, leaderboard, and notifications; refresh repeatedly. | Useful empty states; no historical sample courses, solved questions, fake viewers, invented testimonials/statistics, exams, contests, or notifications appear. |
| DATA-02 | P0 | Authorized maintainer | Run the read-only `node scripts/review-dummy-data.mjs`; compare counts with the saved post-cleanup review and confirm owner/admin access. | No unprotected historical sample matches reappear; Intisar and preserved Test Admin remain accessible. Investigate any new match before deletion. Never rerun the deletion script as a manual smoke test. |
| DATA-03 | P1 | Tester | Visit all main pages twice; compare database collection counts before/after excluding intended session/auth activity. | Read-only browsing does not reseed sample courses, users, exams, contests, or notifications. |
| DATA-04 | P1 | Tester | Search rendered pages for legacy course titles from the cleanup review; open saved old sample URLs. | Deleted sample content is absent; stale URLs fail gracefully rather than recreating samples or showing unrelated content. |
| UI-01 | P2 | Tester | Repeat login, course detail, audience builder, exam and contest forms at 360px mobile width and desktop width. | Controls remain usable; no clipped submit buttons, unreadable text, or unintended horizontal scrolling. |
| UI-02 | P2 | Tester | Switch Bangla/English on supported pages; navigate and reload; check dates, marks, input labels, and errors. | Supported language state behaves consistently; values/IDs remain unchanged and important messages are understandable. Record untranslated new labels as usability findings. |
| UI-03 | P2 | Tester | Use Tab/Shift+Tab, Enter/Space, and keyboard selection through the principal forms and modal controls. | Focus visible; controls have understandable names; keyboard users can complete and exit the workflow. |
| UI-04 | P1 | Tester | Open a nonexistent course/exam/contest URL; simulate an offline request in DevTools; restore connectivity and retry. | Clear not-found/error state without private data, fake success, endless loading, or unrelated fallback content; retry recovers where supported. |
| UI-05 | P1 | Tester | Keep Console/Network open while doing the main workflows; check repeated clicks, reloads, and Back navigation. | No uncaught application exceptions or unintended duplicate records; failed requests show useful feedback. Redact secrets from captured logs. |

## 12. Evidence and report templates

For each failure, include:

```text
Defect ID: BUG-001
Related test case:
Title:
Environment: staging URL, database label (no connection string)
Version: branch, commit, working-tree snapshot/reference
Browser / OS / viewport:
Role / test account label:
Preconditions and relevant record IDs:
Steps to reproduce:
Expected result:
Actual result:
Reproducibility: e.g. 3/3 attempts
Severity and user impact:
Screenshot/video/log reference (secrets removed):
Reported by / timestamp (Asia/Dhaka):
Fix reference / retest result:
```

Summarize each run using this format:

| Item | Value |
| --- | --- |
| Run ID / tester / date | Fill in |
| Environment / version | Fill in |
| Planned / executed | Fill in; executed = Pass + Fail |
| Pass / Fail / Blocked / N/A / Not Run | Fill in; totals must match planned cases |
| Open critical/high defects | Link defect records |
| Provider-dependent tests outstanding | List IDs and prerequisites |
| Recommendation | Ready for next test stage / needs fixes; explain remaining gaps |

## 13. Known limits and completion criteria

- Education/department values are self-reported. Audience filtering is not institutional identity verification.
- Live encrypted playback and token-expiry tests remain pending a real Bunny video. Configuration verification alone is insufficient.
- Production SMS and Google OAuth need working provider setup for their end-to-end cases. A development-only OTP display does not establish real SMS delivery.
- Real payment settlement, refunds, and payout transfer cannot be signed off while provider integration is unavailable. The current expected checkout behavior is safe unavailability.
- The in-process code grader and unresolved production dependency advisories remain deployment blockers. Manual functional passes do not clear these findings. See [PROJECT_AUDIT.md](PROJECT_AUDIT.md) and its later update.
- The exam timer case documents browser behavior; it does not certify a server-trusted start time or elapsed-time enforcement.

Finish the manual run when every planned case has a recorded status, every failure has reproducible evidence, and all blocked cases have a named prerequisite. Retest affected cases after a fix. Keep test records in staging and share the sanitized report with the team. Do not describe the project as fully production-ready solely because these cases pass.
