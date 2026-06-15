# Navas — History

## Project Context

- **Project:** World Cup 2026 Daily Tracker & Highlights System
- **Owner:** omerZeli
- **Stack:** Node.js · Playwright · PostgreSQL · React/Vite · GitHub Actions
- **My Role:** Tester / QA
- **Critical Constraint:** SPOILER-LEAK PREVENTION is my primary test target — scores must NEVER reach storage or UI

## Test Strategy by Phase

- **Phase 1/2 (worker):** Unit tests for date window calculation, API response stripping, YouTube URL extraction
- **Phase 3 (DB):** Integration tests — verify no score columns exist in schema, data integrity
- **Phase 4 (frontend):** Component tests — no score rendering, highlight button works, empty states
- **Phase 5 (CI):** All tests run on push via GitHub Actions

## Key Edge Cases to Cover

- No matches in the 24-hour window
- Football API returns extra fields (score, goals) — must be stripped
- YouTube returns no results for a match — graceful null/empty
- Hebrew characters in search query — encoding/URL safety
- Match postponed or rescheduled mid-window
- CI cron runs twice in a day — idempotency check

## Team

- Zidane — Defines acceptance criteria I test against
- Ramos — Primary output I validate
- Modric — Integrates my tests into CI pipeline

## Learnings

<!-- Navas's personal learnings accumulate here -->

## QA Review — 2026-06-15

### Current Assessment

I reviewed the current codebase summary as a QA pass over the existing implementation. Effective automated test coverage is **zero** across backend, frontend, and integration paths. There is no installed or configured test runner for application tests yet. That means all critical behavior — including spoiler prevention, time-window filtering, DB idempotency, scraper stability, and frontend rendering — is currently unguarded against regression.

### Existing Coverage Status

- **Backend:** No unit tests, no integration tests, no contract tests, no worker pipeline tests
- **Frontend:** No component tests, no rendering tests, no smoke tests
- **API:** No endpoint tests for `GET /api/matches`
- **Database:** No integration test validating schema behavior or upsert idempotency
- **Scraper:** No mocks, no selector monitoring, no reliability checks
- **CI:** No QA gate to block regressions before merge/deploy

### Bugs Already Identified

1. **Frontend team name render bug**
   - `App.jsx` uses `{homeTeam.name}` and `{awayTeam.name}`
   - Stored/backend values are strings, not nested objects
   - Expected result: names should render directly from the string fields
   - QA impact: match cards appear broken or blank

2. **Frontend React key bug**
   - `key={match.id}` is incorrect
   - DB objects expose `matchId`, not `id`
   - QA impact: React warnings, unstable list reconciliation, risk of incorrect re-render behavior

3. **Missing CSS classes / styling contract gap**
   - Missing selectors: `.match-card`, `.teams`, `.vs`, `.match-time`, `.highlights-link`, `.match-list`, `.status-msg`, `.error`
   - QA impact: UI may functionally render but fail visual expectations and state clarity

### Highest-Risk Functional Areas

1. **Spoiler-free compliance (highest priority)**
   - Any leak of scores/goals into DB, API, logs, or UI is a product-level failure
   - `mapMatch()` must be locked down with regression tests

2. **UTC boundary correctness**
   - `filterToPreciseWindow()` / time helpers need validation around UTC midnight and inclusive/exclusive boundaries
   - Risk: wrong matches included or excluded from the 24h window

3. **Worker pipeline integrity**
   - `worker.js` is a critical one-shot flow: fetch → translate → scrape → upsert
   - No current protection against partial failure or data-shape regressions

4. **YouTube scraper fragility**
   - `youtubeScraper.js` depends on Playwright and DOM selectors likely to drift
   - `a#video-title` is a known brittle selector choice

5. **DB idempotency**
   - `upsertMatches()` must be verified to avoid duplicates if the worker runs twice or retries

6. **Translation fallback quality**
   - `translateTeam()` fallback to English is acceptable functionally, but may reduce highlight search quality
   - Needs test coverage for exact mapping, variants, and fallback behavior

7. **Frontend resilience to incomplete data**
   - `highlightUrl` null handling appears intentionally safe via conditional rendering
   - Remaining risk: missing/null fields in time/team data could still break rendering

8. **Rate-limit behavior**
   - `footballApi.js` short-circuits correctly when `x-requestsavailable` is missing/NaN according to summary
   - Still needs tests to prevent regressions in backoff behavior

### Test Plan I Would Execute First

#### Phase 1 — Fast unit coverage on pure/near-pure backend logic
Recommended framework: **Vitest**

Priority order:
1. **`translateTeam()`**
   - exact known mappings
   - spelling/variant handling if implemented
   - fallback to original English name for unknown teams
2. **`mapMatch()`**
   - assert spoiler data never survives mapping
   - verify only allowed fields are returned
   - ensure search-friendly team/time fields remain intact
3. **`filterToPreciseWindow()` / `time.js` helpers**
   - lower boundary inclusion
   - upper boundary exclusion/inclusion behavior as designed
   - UTC midnight crossover
   - timezone normalization consistency
4. **Rate-limit helper behavior in `footballApi.js`**
   - missing header
   - non-numeric header
   - low remaining quota path

#### Phase 2 — Integration tests around persistence
Recommended framework: **Vitest** with DB integration setup

1. **`initDB()`** creates expected schema
2. **`upsertMatches()` idempotency**
   - insert same match twice
   - verify row count does not grow incorrectly
3. **`getMatches()`** returns expected shape for frontend
4. Verify stored records do **not** contain score-related fields

#### Phase 3 — API contract tests
Recommended framework: **Vitest** (HTTP/server tests)

1. `GET /api/matches` returns 200
2. response shape matches frontend expectations
3. empty DB returns safe empty array / empty state contract
4. response never exposes spoiler fields

#### Phase 4 — Frontend rendering tests
Recommended framework: **React Testing Library** (+ Vitest as runner if unified setup is preferred)

1. Render list with valid match fixtures
2. Verify team names display from string fields
3. Verify `matchId` is used as stable key after bug fix
4. Verify highlight link renders only when URL exists
5. Verify loading/empty/error states render correctly
6. Verify UI does not display any score text even if malformed data is supplied

#### Phase 5 — Scraper confidence tests
Recommended approach: mocked tests first, selective live verification second

1. Mock Playwright page results to test extraction logic deterministically
2. Add a minimal smoke test for selector failure behavior
3. If live tests are ever added, keep them non-blocking because YouTube DOM changes will make them flaky

### Missing QA Infrastructure

- No application test framework installed
- No shared fixture strategy
- No deterministic test data for matches
- No CI job enforcing QA checks on push/PR
- No smoke/regression suite for spoiler prevention
- No documented test matrix for worker/API/frontend behavior

### Recommended Tooling

- **Backend unit/integration:** Vitest
- **Frontend component tests:** React Testing Library
- **Unified runner preference:** Vitest for both backend and frontend where possible
- **Scraper tests:** Vitest + Playwright mocks/stubs; avoid relying entirely on live YouTube E2E

### QA Recommendation Summary

If I were sequencing QA work, I would first fix the two known frontend bugs, then immediately add automated regression coverage for:
1. `translateTeam()`
2. spoiler-free `mapMatch()` behavior
3. UTC window filtering
4. DB upsert idempotency
5. `App.jsx` rendering with real response-shaped fixtures

This codebase is currently in a **high-risk / low-observability** state: the product’s most important promise (no spoilers) is not enforced by tests, and the main user-facing component already contains confirmed rendering defects. The fastest risk reduction comes from adding targeted Vitest coverage to backend transformation logic and React Testing Library coverage to the frontend rendering contract.

## 2026-06-15 — Cross-Agent Sync Note

- Add these to active regression targets: `frontend/src/App.jsx` incorrectly dereferences `homeTeam.name` and `awayTeam.name` even though the API returns plain strings, and it uses `match.id` instead of `match.matchId` for list keys.
- Any frontend smoke test or integration check should assert the corrected contract once the UI is patched.

## 2026-06-15 — Tailwind UI spoiler-free QA checklist

- Reviewed the planned Task 6 UI specifically for spoiler-leak risk.
- Captured acceptance criteria that restrict rendered data to safe `/api/matches` fields and forbid score, goal, result, or winner language in DOM text and attributes.
- Added edge-case coverage for missing highlights, unknown statuses, invalid dates, long team names, duplicate `matchId` values, and non-Latin text.
- Marked the review yellow pending Ronaldo verification against rendered DOM output.
