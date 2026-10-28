# e-Sikho project audit

> Historical first-pass snapshot. The later approved assessment workflow, database cleanup, and Bunny configuration are documented in [ASSESSMENT_WORKFLOWS.md](ASSESSMENT_WORKFLOWS.md). That update supersedes the earlier review-only cleanup and missing-Bunny-credentials notes below.

Reviewed on 28 October 2026 (Asia/Dhaka). Branch: `codex/project-audit`. Starting commit: `295ab4a` by Intisar Rahman Khan.

The checks below pass after the fixes. The project still has deployment blockers: vulnerable dependencies, unsafe isolation of student code, and incomplete payment/media provider integration. Passing unit tests does not establish that every production workflow is correct.

## Scope and contribution preservation

The existing Next.js, Mongoose models, components, and contributor history are preserved. There are no dependency upgrades, schema migrations, commits, pushes, or deployments. The largest deletions are dummy datasets, demo seeders, a simulated payment form, and fabricated statistics. Existing workflow tests were retained; tests tied to removed demo behavior now verify the safe behavior.

`lib/courses-data.ts` retains its interfaces and compatibility helpers, with an empty sample catalog. Real courses come from MongoDB. Historical standalone seed scripts are disabled at their entry points and retained as review evidence. Their data is not automatically inserted by the application.

The original `actions/admin.ts` uses CRLF in the Git index. Its original endings are preserved; a local `.git/info/attributes` rule prevents unrelated newline changes in the review diff. This local metadata adjustment is not a project source change.

## Fixed issues

| Area | Finding and resulting behavior |
| --- | --- |
| Authentication | Removed role-only, hardcoded-account, developer-provider, and email-only login bypasses. Email login verifies the stored password; phone signup requires an OTP; phone login requires a password or OTP. Missing accounts are not silently recreated during JWT refresh. |
| Sessions | Removed shared dummy user IDs and the public fallback session secret. Suspended/blocked accounts lose refreshed sessions. Google sign-in preserves an existing user's role/status. Database errors fail authentication rather than substituting another account. |
| Local secrets | Replaced the published development session secret in ignored local environment files. Deployment environments must also replace that old value. No secret values are included in this report. |
| Routing | Added instructor route role checks, prevented blocked-account redirect loops, and rejected external/protocol-relative login callback targets. |
| Video access | Playback verifies that the lesson's module belongs to the requested course. A different course entitlement cannot unlock it. Missing videos return an error rather than an unrelated YouTube lecture. |
| Course editing | Only the owning instructor or an administrator can modify course modules/lectures. Lesson deletion/editing and module assignment validate course membership. The instructor curriculum action no longer exposes private media to students or anonymous callers. |
| Public catalog | Draft courses are withheld from the public catalog/details response. Paid lesson URLs are omitted from public course metadata. Draft courses cannot be enrolled in through the enrollment action. |
| Bunny integration | Missing credentials produce an upload failure. Removed the fake upload GUID and the unimplemented direct-HLS URL helper. Signed embed tokens follow the provider's SHA-256 recipe; URL parsing checks actual provider hostnames. Bunny upload failures do not silently fall back to public storage. |
| Playback and analytics | YouTube/Vimeo watch URLs are converted for embedding. Stored Bunny references are stable, with fresh signing for authorized playback. Removed timer-generated watch progress, invented viewers/drop-off timestamps/watch hours, dummy leaderboards/exams, and fake monthly growth. HTML5 progress uses media events. |
| Resources and live classes | Removed fabricated PDF links, meetings, sessions, and automatically seeded questions. Paid PDF URLs and live meeting information require course access. Answering/pinning/archiving live questions/sessions requires course ownership or admin rights. |
| Assessment integrity | Client-controlled preview flags no longer reveal exam answers/hidden cases to students or anonymous callers, or active contest solutions. |
| Payments | Removed simulated card/mobile success and PIN collection. The confirmation endpoint cannot turn a client-supplied `success` into enrollment. Paid checkout explicitly reports unavailable until a real provider is integrated. Free published-course enrollment remains supported. |
| Financial actions | Commission processing requires an authenticated administrator and a positive amount. Full verified-provider reconciliation and idempotency belong in the payment integration described below. |
| OTP delivery | OTPs use cryptographic randomness. Production does not log/return codes or claim successful delivery without a provider. Failed delivery is reported and its pending OTP is removed. Development-only code display remains available. |
| Runtime dummy content | Removed automatic sample contest/exam/notification insertion, admin sample-data buttons, fallback sample courses, fabricated marketing testimonials/statistics, and fake live activity. Legacy sample-writing actions return an error without database writes. |
| Security labels | Replaced unconditional encryption/DRM claims with descriptions of actual access checks. Watermarks and hidden download buttons do not establish media encryption. |

## Validation

| Check | Result |
| --- | --- |
| `npm run test:unit -- --reporter=dot` | 317 tests passed across 44 files. Baseline was 279 tests across 41 files. |
| `npx tsc --noEmit --incremental false` | Passed. |
| `npm run lint -- .` | Passed with 0 errors and 16 existing image/hook warnings. |
| `npm run build` | Passed using Next.js 14.2.35 and Node 24.19.0. Existing Auth.js Edge-runtime warnings remain. |
| `npx playwright test --config=playwright.audit.config.ts` | 8 browser smoke tests passed using installed Chrome in headless mode. |
| `git diff --check` | Passed. |
| `node scripts/review-dummy-data.mjs` | Completed as a read-only database preview; zero database writes. |
| `npm audit --omit=dev` | Unresolved findings: 1 critical and 2 high, covering `next`, its bundled `postcss`, and `source-map-js`. |

Browser coverage includes home/catalog rendering without browser exceptions, removal of developer login buttons, anonymous redirects for student/instructor/admin/payment pages, unauthorized payment rejection, and public course metadata without lesson media URLs. It does not perform real purchases, send real OTPs, or alter user/course records.

The older full Playwright suite still expects dummy credentials, static sample slugs, and previous page layouts. It was not used as evidence that real authenticated flows work. Authentication, ownership, expiry, revision access, grading confidentiality, progress mutations, and financial authorization were verified with isolated unit tests. Live Google login, SMS delivery, real Bunny upload/encryption/playback, payment settlement, and signed-in role workflows still need provider credentials and dedicated test accounts.

## Existing database cleanup prepared for review

The preview is saved locally at `audit-local/dummy-data-review.json`. It is ignored by Git because it contains record IDs. The script and historical fingerprints are in `scripts/review-dummy-data.mjs` and `scripts/dummy-data-fingerprints.json`.

| Candidate collection | Records matching historical sample fingerprints |
| --- | ---: |
| Users | 18 |
| Courses | 5 |
| Instructors | 5 |
| Exams | 3 |
| Contests | 5 |
| Payments | 3 |
| Enrollments | 6 |
| Total candidate records | 45 |

Related records include 9 modules, 21 lessons, 12 enrollments, 3 payments, 2 wishlists, 3 instructor profiles, and 14 notifications. These counts overlap the candidate list and are not an additional deletion total.

Names/titles/emails can also belong to legitimate records. These are candidates for team review, not records confirmed safe to delete. No database records have been deleted or modified. The preview tool intentionally has no apply/delete mode. Approve exact IDs and linked content before preparing a deletion transaction. Back up approved records first. Older seeders also modified aggregate balances, ratings, and enrollment counters without provenance; those cannot be safely reversed by matching a name.

To regenerate the preview: `node scripts/review-dummy-data.mjs`. It loads the same local environment files as Next.js and prints counts without exposing connection credentials.

## Larger changes requiring your decision

1. **Dependency security upgrade — deployment priority.** The installed Next.js 14.2.35 has critical advisories. `npm audit` proposes a major Next.js upgrade, so no automatic upgrade or lockfile rewrite was performed. A controlled framework/auth migration with regression testing is needed. The maintainer advisory specifically identifies a Windows-hosted remote-code-execution risk for affected versions: [Next.js security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36).
2. **Isolated code execution — deployment priority.** `lib/code-evaluator.ts` runs student JavaScript with `node:vm` in the application process. This is not a safe boundary for untrusted submissions. An isolated judge/worker with resource limits and restricted network/filesystem access requires a separate design. The existing grader has not been replaced: [Node.js VM documentation](https://nodejs.org/api/vm.html#vm-executing-javascript).
3. **A verified payment provider.** Choose the provider before adding its SDK or hosted checkout. Verify callback signatures, expected amount/currency/course/user, successful payment state, refund/payout reconciliation, and replay/idempotency rules. Commission settlement should become an internal operation driven by verified payment records. Paid checkout remains unavailable meanwhile.
4. **Provider-backed protection for all paid media.** Local Bunny library/API/token credentials are missing. Configure embed-token authentication and the selected DRM options in Bunny, then test actual uploads and playback. Existing public MP4/R2 URLs and files under `public/uploads/pdfs` remain directly accessible to someone with the URL; UI restrictions do not secure the underlying files. Migrating paid assets into private storage/provider delivery needs team agreement. Token signing and media encryption are separate features: [Bunny token authentication](https://bunny.net/docs/stream/token-authentication), [Bunny security settings](https://bunny.net/docs/stream/security-options).
5. **Real provider telemetry and test fixtures.** Connect iframe player events for accurate Bunny/YouTube/Vimeo watch progress, rather than inferring viewing from an open page. Configure production SMS and verify delivery with the provider. Replace legacy E2E demo-login assumptions with dedicated accounts and an isolated test database before expanding automation.

No advanced feature implementation, database deletion, framework upgrade, or deployment is included in this audit.
