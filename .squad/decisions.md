# Squad Decisions

## Active Decisions

### 2026-06-15 — Codebase knowledge sync performed
- Full codebase review completed across architecture, backend, frontend, DevOps, and QA perspectives.
- Team history was updated to reflect the current repository as if the team had built it.
- Two frontend contract bugs were identified in `frontend/src/App.jsx` and should be treated as shared team knowledge until fixed:
  1. `homeTeam` and `awayTeam` are plain strings from the backend, so `homeTeam.name` / `awayTeam.name` are incorrect.
  2. Match identity is stored as `match.matchId`, so React list keys must not use `match.id`.

### 2026-06-15 — Backend architecture baseline
- Chose ESM modules across the worker, services, and utilities for consistent modern Node.js imports/exports.
- Standardized HTTP access on axios for authenticated Football Data API calls and predictable response/header handling.
- Used date-fns for the 24-hour yesterday/tomorrow window helpers to keep time calculations explicit and readable.
- Set the rate-limit throttle threshold to 2 remaining requests by default, with throttling based on the API reset header before returning control.
- Enforced spoiler-free mapping at the API boundary so only match id, team names, utcDate, and status move downstream.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction