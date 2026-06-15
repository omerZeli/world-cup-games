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

### 2026-06-15 — No-git operating rule
- Per user directive, this project must not use git actions during agent execution.
- Prohibited examples include `git commit`, `git add`, `git push`, `git checkout`, and `git reset`.
- Team members should make file-only changes and leave all git operations to the user.

### 2026-06-15 — Frontend Tailwind UI direction
- The frontend dashboard should use a sticky blue gradient header with a compact Match Center pill to give the SPA a live-event feel.
- `frontend/src/App.jsx` should rely on Tailwind utility classes and no longer depend on `App.css`.
- `lucide-react` should be imported through a namespace so the UI can prefer `Youtube` and safely fall back to `Play` in the installed package version.
- Match cards should prioritize team names, a centered VS badge, a date/time chip, and a status pill.
- The highlight CTA must stay prominent, generic, and gated to `FINISHED` matches with a truthy `highlightUrl`.
- No scores, winners, or result language may be rendered anywhere in the UI.

### 2026-06-15 — UI spoiler-free QA acceptance
- The frontend may render only spoiler-safe fields from `/api/matches`: `matchId`, `homeTeam`, `awayTeam`, `utcDate`, `status`, and optional `highlightUrl`.
- Rendered DOM text, attributes, and accessible names must not expose score, goal, result, or winner language.
- Match cards must ignore unknown payload keys even if the backend later returns extra fields.
- Error and empty states must remain safe and must not surface raw backend payloads.
- UI handling should stay resilient for unknown statuses, missing highlight URLs, invalid dates, long team names, and non-Latin text.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction