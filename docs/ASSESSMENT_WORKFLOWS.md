# Assessment hosting, audience rules, and real-data setup

Updated 28 October 2026 (Asia/Dhaka). Changes remain on `codex/project-audit` without commits or pushes. Existing course, exam, and contest components/actions were extended; the application architecture and contributor history are preserved.

## Instructor workflow

1. Create a real course at `/instructor/create-course`, or obtain course assessment access from an administrator. The exam and contest course selectors include your created courses and courses explicitly assigned to you, including drafts.
2. Create a course exam at `/exams/create` or a course contest at `/contests/create`. The course must be published and the student must have current enrollment/revision access to participate. Owners and assigned instructors can prepare assessments while a course is a draft.
3. For global hosting, open `/instructor/assessments` and apply separately for **global exams** or **global contests**, explaining the teaching purpose and intended audience.
4. A superadmin reviews the application at `/admin/assessments`. Approval unlocks the matching global option in the creation form. Rejected applications show feedback and can be resubmitted. A pending or approved application cannot be duplicated.
5. Choose the audience when publishing a global assessment. Blank audience filters allow registered learners. Selected filters combine with **AND**: education level, department/study stream, and optional specific student IDs must all match. Each individual filter accepts any selected value within its list.

Example: School + Science + a selected student means only that student with a school/science profile is eligible. University + CSE means eligible university CSE learners can see and join the assessment.

Global publishing permission is granted per instructor and assessment type. Each published global assessment records its approved scope and, for an instructor, its hosting-permission reference. Only the superadmin can approve or reject hosting applications. Administrative accounts retain platform publishing authority.

## Student profiles and access enforcement

Students set **Education level** (School, College, University) and **Department or study stream** in `/student/settings`. Department matching ignores case and normalizes labels such as `Computer Science & Engineering (CSE)` to `cse`. No university level is guessed from an old profile default.

These education details are self-reported profile attributes. Institutional verification, student-ID verification, and an approved department registry would be separate features.

The server applies the same eligibility policy to exam lists, homepage exam/contest banners, contest lists, direct assessment reads, and answer submissions. Filtering only in the browser is not used for authorization. Profile changes affect eligibility on the next request. Expired course access remains subject to the existing revision-access policy.

Course assessments require actual ownership or an explicit instructor assignment. The superadmin portal includes **Assign course assessment access**, which grants an approved instructor assessment access by email. It does not transfer ownership of the course or rewrite another contributor's content.

## Authoring and logic fixes

- Course selection is always visible. Empty course lists show a useful message instead of silently turning an assessment into a public global exam.
- The exam builder starts with one empty question. Prefilled solved questions and random sample insertion were removed.
- Server validation checks answer choices, correct-answer indexes, positive marks, pass marks against computed total marks, duration, negative marking, and attempt limits.
- Contests have a real start/end window and duration, valid MCQ problems, and separate global-hosting permission. Current Upcoming/Live/Ended status is derived from the actual dates. Finished contests leave the homepage banner and remain available in the catalog when the viewer is eligible.
- Fabricated dashboard exam dates were removed. Available exams use actual eligibility and are labelled available rather than assigned invented deadlines.
- Student profile forms no longer invent interests, skills, career titles, or an academic background when real values are missing.

## Bunny Stream configuration

Library **792504** is configured in the ignored `.env.local` using distinct Stream API and token-authentication keys. The video API returned HTTP 200. Keys were checked for accidental inclusion in project files and were not found in tracked/shareable source files.

With your explicit approval, the library was updated and then read back successfully:

| Setting | Verified value |
| --- | --- |
| Embed view token authentication | Enabled |
| MediaCage DRM | Enabled |
| MP4 fallback | Disabled |
| Public original files | Disabled |
| Early Play | Disabled |

The update changed the DRM and MP4 fallback flags; original-file exposure and Early Play were already disabled. No Enterprise DRM option or paid encoding tier was enabled. References: [Bunny security options](https://bunny.net/docs/stream/security-options), [video-library update API](https://bunny.net/docs/api-reference/core/stream-video-library/update-video-library).

Course video file uploads use Bunny when the configured credentials are available. Stored references are stable; playback URLs are signed after access checks. Public preview videos get a short-lived signed preview URL. Existing legacy embed URLs and the current `player.mediadelivery.net` hostname are recognized.

The library currently contains **zero videos**. Actual media upload, encoding, encrypted playback, and expired-token rejection still need to be checked with one of your real lesson videos. No dummy video was uploaded. Provider-backed DRM applies to Bunny-hosted content; external YouTube/Vimeo links and independently public file URLs are not encrypted by this application.

Large video uploads should use direct resumable browser-to-Bunny uploading. The existing multipart server-action upload path still has the framework's request-size limit; a dedicated large-file upload implementation is a proposed next step, not a completed feature. [Bunny resumable upload documentation](https://bunny.net/docs/stream/tus-resumable-uploads).

## Confirmed sample-data cleanup

A full BSON-compatible local backup was written before a MongoDB transaction removed **171 confirmed sample records**:

| Collection/group | Removed |
| --- | ---: |
| Courses / public instructor profiles / modules / lessons | 5 / 5 / 9 / 21 |
| Fake user accounts | 15 |
| Exams / contests | 3 / 5 |
| Enrollments / payments / platform commissions | 13 / 3 / 3 |
| Exam submissions / contest submissions | 9 / 4 |
| Wishlists / course routines | 3 / 1 |
| Comments / instructor applications / moderation reports | 1 / 3 / 4 |
| Sample notifications | 64 |

Your Intisar account was preserved. Existing administrator accounts, including the requested Test Admin account, were preserved. A phone-login account whose origin could not be confirmed as synthetic was also preserved. Historical phone-login addresses were removed from the dummy fingerprint list rather than treating real accounts as samples.

The cleanup also handles both old slug references and MongoDB course IDs, so it does not leave sample enrollments/wishlists pointing at deleted sample courses. Unrecognized content under an apparent sample course would prevent automatic deletion of that course. Audit history and account balances were not blindly rewritten; any old aggregate balance changes without a reliable ledger need a separate review.

The follow-up read-only scan found **zero remaining unprotected matches** in the historical sample-user, course, instructor, exam, contest, live-class, payment, and enrollment categories.

Local evidence is under `audit-local/` and is ignored by Git:

- `sample-cleanup-result.json`: committed transaction, per-collection counts, preserved account IDs, and backup path.
- `sample-cleanup-backup-2026-10-28T11-53-02-629Z.json`: complete deleted-record backup. It contains private account data and should remain local.
- `dummy-data-review.json`: post-cleanup preview.
- `retired-sample-sources/`: archived legacy seed data before removal from project source.
- `bunny-security-before.json`, `bunny-security-after.json`, and `bunny-verification.json`: non-secret provider verification results.

Legacy seed commands now stop with an explicit error, including the old hardcoded-superadmin seeder. `scripts/courses-data.json` was removed from project source. Historical cleanup fingerprints and isolated test fixtures remain as maintenance/test evidence; they are not inserted into the application database by normal page requests.

## Validation and running locally

- 350 unit tests passed across 48 files, including publishing authorization, superadmin-only reviews, course ownership/assignment, education/department/student filtering, profile updates, and rejected forged submissions.
- 8 authenticated browser workflow scenarios passed against a uniquely named temporary database, covering approvals, targeted publishing/banners, excluded students/direct links, instructor assignment, course enrollment, and profile changes. The temporary database was deleted afterward. Test fixture records were never inserted into the project database.
- 7 public-page and access-control browser checks passed. The public course-media check was explicitly skipped because no published courses remain after the sample cleanup; it still needs a real published course for live verification.
- Production build, TypeScript, lint, and whitespace checks passed. Lint retains 16 existing image/hook warnings. Existing Auth.js Edge and Mongoose deprecation warnings remain.

Restart the existing development server once after these schema and environment changes, then use `npm run dev`. The separate verification build uses `.next-assessment-audit` to avoid sharing the active development server's build files.

To run the isolated workflow verification from PowerShell:

```powershell
$env:E_SIKHO_BUILD_DIR = '.next-assessment-audit'
npm run build
node scripts/test-assessment-workflows.mjs
```

The runner checks a dedicated database-name prefix before cleanup and drops only that temporary database. The normal Playwright configuration excludes this suite; running it directly without the isolated runner is rejected.

## Remaining deployment work

The earlier dependency-security findings (one critical and two high production-dependency findings), unsafe in-process `node:vm` code grading, and missing verified payment-gateway integration remain documented in `PROJECT_AUDIT.md`. These are still deployment blockers. This update implements the requested assessment workflow and approved Basic DRM settings; it does not claim that the whole platform is production-ready.
