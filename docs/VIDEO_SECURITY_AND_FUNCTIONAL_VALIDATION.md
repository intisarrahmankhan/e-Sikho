# e-Sikho functional and video security results

Validation completed 4 November 2026 in Asia/Dhaka. Your 12-minute 37-second upload moved from 5% encoding to **100% ready**. It played through e-Sikho when linked to a disposable course and opened by an enrolled learner. Playback advanced in Chrome. Pause, seek, volume, fullscreen controls and reopening the lesson worked. Android Chrome emulation also played the stream.

Encoding prepares streaming renditions. Bunny token checks and MediaCage govern playback access. Basic MediaCage uses clear-key encryption and has limits against a determined viewer. Screen capture and external recording remain possible. [Bunny Basic MediaCage guide](https://bunny.net/docs/stream/mediacage-basic-guide)

## Video access and piracy risks

| Check | Observed result |
| --- | --- |
| Enrolled learner and outsiders | The enrolled browser decoded video. Signed-out, unenrolled and cross-course viewers could not get a private playback link through the app. |
| Missing and modified token | Bunny denied the unsigned and altered embeds. The denial page could return HTTP 200, so video playback and the visible denial were checked. |
| Copied valid link | A signed-out browser played the copied four-hour link. The portal learner watermark was absent. |
| Enrollment expiry | The app refused to create a new link after enrollment expired. The earlier link still played in a clean browser. |
| Short token expiry | A new browser denied the expired link. The browser that had already opened the 25-second link replayed it four seconds after expiry. A fresh request with a unique query and a never-used token expired by 600 seconds also showed denial. |
| Fullscreen watermark | The normal-page learner watermark was outside the fullscreen iframe. |
| Provider asset ownership | An unrelated instructor attached the existing video reference to their own test course and received a signed playback link. |
| Private raw MP4 | The app denied the outsider lesson request. Anonymous direct retrieval returned a valid MP4 through its public file URL. |
| Encrypted delivery | 4 observed playlist responses declared encryption. The sampled playback returned 0 successful MP4 fallback responses. |
| Client secrets | 0 of 73 generated client JavaScript files contained an exact match for a configured Bunny key. |

Bunny’s account-level settings request returned HTTP 401. The current DRM mode, MP4 fallback, original-file access and referrer switches remain deferred. The playback observations above establish the behavior tested on the encoded upload. [Bunny token authentication](https://bunny.net/docs/stream/token-authentication)

## Functional results

| Suite | Passed | Failed | Blocked |
| --- | ---: | ---: | ---: |
| 69 planned cases with focused retests | 61 | 1 | 7 |
| 15 additional video and application checks | 3 | 12 | 0 |
| Selenium WebDriver | 27 | 1 | 4 |
| Assessment browser workflows | 8 | 0 | 0 |
| Vitest unit tests across 53 files | 381 | 0 | 0 |

The suites overlap. The planned cases used Playwright-controlled Chrome and authenticated server actions on real MongoDB test records. The separate Selenium suite used Chrome WebDriver. Unit tests used the repository’s existing mocked dependencies. The production build, TypeScript check and source lint passed.

- A learner with a valid enrollment could not submit their project. An unrelated instructor could list and grade another course’s submission. The project action accepted a lesson from the wrong course.
- A one-lesson course returned seven unsupported live class or exam items. An empty course returned 24 generated lectures. A newly enrolled instructor saw 25% progress with zero recorded activity.
- The PDF viewer opened with a blank document area. Chrome returned HTTP 204 and no bytes before and after opening the iframe, with a unique query and on a Range request. A direct anonymous HTTP request returned a valid PDF. In-app resource filtering passed. The browser failure and public raw-file access both need attention.
- The instructor editor stored the NASA clip reference. Bunny stayed at processing status 2 past four minutes. The lecture action accepted a separate 3,060,963-byte clip. Ready playback was then verified using your existing upload. [NASA educational clip](https://science.nasa.gov/eclips/videos/newtons-laws-on-board-the-international-space-station/)
- The initial API-driven sign-out check timed out on the redirect. The focused run passed through the navbar, protected-page revisit and denied mutation. An isolated empty database passed the empty-content checks. The CSV records the focused outcomes and their evidence source.

Delivered SMS/OTP, Google consent, interactive owner/Test Admin sign-in and physical-mobile playback still need their respective test access. The payment guard rejected forged checkout success. Actual payment settlement and external meeting connection remain outside the exercised flows.

## Data and release implications

The read-only project inventory found 0 published approved courses and 0 linked video lessons. The ready asset is in Bunny. To serve it through e-Sikho, a course needs a lesson linked to the asset. The test linked it only inside a disposable database.

Prioritize enforcing video ownership, removing public URLs for private media and reducing the replay window. Recheck link handling after enrollment expiry, logout and token expiry. Review fullscreen watermark behavior and the account-level Bunny security settings before distributing private lessons.

The test databases, temporary public PDFs and MP4, and both temporary Bunny uploads were removed. The ready upload was verified through read-only provider requests. Its playback test stored observations without taking screenshots of the video.

[Case-by-case results CSV](../output/test-results/e-Sikho_Functional_and_Video_Security_2026-11-04.csv)
