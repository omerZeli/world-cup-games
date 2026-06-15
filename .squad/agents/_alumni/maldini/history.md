# Maldini — History

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

- Pelé — Defines acceptance criteria I test against
- Zidane — Primary output I validate
- Roberto Carlos — Integrates my tests into CI pipeline

## Learnings

<!-- Maldini's personal learnings accumulate here -->
