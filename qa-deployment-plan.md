# QA Testing & Release Deployment Plan

## 1. QA Testing Strategy

### 1.1 Scope of Testing
- **Community & Discussion Features**:
  - Lesson Q&A Discussion Board (Nested comments, liking, solution flagging).
  - Community Notes & Resource Sharing (Public/private notes, attachments).
- **Security**: Cross-Site Scripting (XSS) prevention testing on comment bodies and lesson notes using `xss` library validation.
- **Admin Management (Regression)**: Verify that user promotion, account suspension, and paginated views continue to work without side-effects.

### 1.2 Testing Phases
- **Unit Testing**:
  - Write test cases for `Comment` and `LessonResource` models.
  - Test server actions (`addComment`, `toggleLikeComment`, `flagSolution`, `addLessonResource`) by mocking the database.
- **Integration Testing**:
  - Ensure the UI correctly triggers server actions.
  - Test nested comment rendering.
- **End-to-End (E2E) Testing (via Playwright)**:
  - Simulate a student posting a question.
  - Simulate a peer replying and liking a post.
  - Simulate an instructor flagging a post as a solution.
  - Simulate attempting an XSS attack in the notes field and verify sanitization.

### 1.3 QA Acceptance Criteria
- 100% of P0/P1 bugs are resolved.
- XSS attempts safely neutralized.
- No regression in existing Admin capabilities.

---

## 2. Release & Deployment Coordination

### 2.1 Pre-Deployment Checklist
- [ ] All QA metrics met and signed off.
- [ ] Database migrations/schema updates verified (Ensure `Comment` and `LessonResource` collections are provisioned).
- [ ] Environment variables updated in Staging and Production (if applicable).
- [ ] Final code review approved by Lead Developer.

### 2.2 Staging Deployment
- **Target**: Staging Environment (Vercel/AWS).
- **Steps**:
  1. Merge `feature/community-discussion` into `staging` branch.
  2. Auto-deploy to Staging environment.
  3. Perform Smoke Testing (Post 1 comment, Upload 1 resource).

### 2.3 Production Release
- **Target**: Production Environment.
- **Schedule**: TBD (Targeting off-peak hours).
- **Steps**:
  1. Merge `staging` into `main`.
  2. Monitor build process in CI/CD pipeline.
  3. Post-deployment sanity check.
  4. Notify community of new discussion features.
  5. Monitor server error logs for the first 24 hours.

### 2.4 Rollback Plan
- In case of critical failure, revert the last merge commit on `main`.
- Restore the previous database snapshot if corrupted.
