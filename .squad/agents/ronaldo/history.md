# Ronaldo — History

## Project Context

- **Project:** World Cup 2026 Daily Tracker & Highlights System
- **Owner:** omerZeli
- **Stack:** React/Vite · PostgreSQL (read via Supabase client or REST) · Vercel
- **My Role:** Frontend Dev
- **Critical Constraint:** STRICTLY SPOILER-FREE — UI must NEVER render scores, goal counts, or match outcomes

## UI Design Goals

- **Yesterday's games:** Match cards with team names, match time, and a YouTube highlight button
- **Today's schedule:** Upcoming matches with team names and kickoff times
- **No scores anywhere** — not even as a "hidden" field in the DOM

## Data Contract (from Ramos)

- Read `data.json` schema once Ramos defines it — build components against that contract
- When Postgres is live (Phase 3), switch to Supabase client or REST API

## Team

- Zidane — Calls architecture decisions (TypeScript vs JS, component library choice)
- Ramos — Defines the data schema I consume
- Modric — Handles Vercel deployment config

## Learnings

<!-- Ronaldo's personal learnings accumulate here -->


## 2026-06-15 — Frontend codebase deep audit

I reviewed the current Vite/React frontend as if I had originally assembled it, and the app is still in an early scaffolded state with a single-page fetch/render flow.

### What the frontend currently does

- `App.jsx` owns the whole UI and state.
- It fetches match data once on mount with `axios.get('/api/matches')` inside `useEffect`.
- It tracks three top-level states only: `loading`, `error`, and `matches`.
- `formatMatchTime(utcDate)` converts the backend UTC timestamp into a localized browser string showing weekday, month, day, hour, and minute.
- `MatchCard` renders:
  - home team vs away team
  - localized kickoff/match time
  - a highlights link only when `status === 'FINISHED'` and `highlightUrl` exists
- The page currently renders one flat list of matches under `⚽ World Cup 2026`.

### Critical rendering/data contract bugs I spotted in `App.jsx`

1. **Team name rendering bug**
   - Current code assumes `homeTeam` and `awayTeam` are objects and reads `homeTeam.name` / `awayTeam.name`.
   - The database contract actually returns both fields as plain strings (`TEXT`).
   - Result: the UI renders `undefined vs undefined` instead of team names.
   - Correct fix:
     - replace `{homeTeam.name}` with `{homeTeam}`
     - replace `{awayTeam.name}` with `{awayTeam}`

2. **React key bug on match list**
   - Current code uses `key={match.id}`.
   - Backend rows expose `matchId`, not `id`.
   - Result: every key is effectively `undefined`, which causes React key warnings and unstable list reconciliation.
   - Correct fix:
     - replace `key={match.id}` with `key={match.matchId}`

### Styling state

`App.css` is still basically the Vite starter stylesheet, so the component markup and the stylesheet are out of sync.

The following classes are already used by the JSX but are **not actually defined yet**:

- `.match-card`
- `.teams`
- `.vs`
- `.match-time`
- `.highlights-link`
- `.match-list`
- `.status-msg`
- `.error`

That means the semantic structure is there, but the product UI has not been visually implemented yet.

### Vite / API wiring

- `vite.config.js` proxies `/api/*` to `http://localhost:3000` in development.
- That is correct for local DX with an Express backend.
- Important production note: this proxy only helps in dev. Production needs either:
  - the frontend build served by the backend, or
  - separate frontend/backend deployment with a real API base strategy.

### Current frontend limitations / still needs building

The app is functional only at the most basic level. It still needs:

- **date-aware grouping/filtering**
  - split yesterday's finished matches from today's upcoming schedule
  - render only the intended day buckets instead of dumping the full response list
- **real styling pass**
  - card layout, spacing, typography, responsive list treatment, highlight CTA styling, loading/error presentation
- **spoiler-free review**
  - confirm no accidental score/result fields are ever surfaced if backend payload expands later
- **empty/error UX improvements**
  - current messaging is technically fine but still barebones
- **data-shape hardening**
  - guard against missing `highlightUrl`, invalid dates, or missing `matchId`
- **production API strategy**
  - avoid assuming `/api/matches` works outside local proxy mode without deployment coordination

### Extra implementation notes I would keep in mind

- `formatMatchTime()` uses the user's local timezone through `toLocaleString`, which is fine for consumer UX but means displayed times vary by client locale/timezone.
- The highlights CTA is correctly gated behind `FINISHED` plus `highlightUrl`, which fits the spoiler-free/highlights-only direction.
- Because the whole app currently lives in one file, the next clean refactor would likely be:
  - keep `App` as container/state owner
  - extract `MatchCard`
  - potentially add derived match sections (`YesterdayMatches`, `TodayMatches`) once date filtering lands

### My frontend assessment

The skeleton is good for a first pass, but it is not yet production-ready. The biggest immediate correctness issues are the wrong team field accessors and the wrong React key field. After those are fixed, styling and date-based presentation are the next highest-value frontend tasks.

## 2026-06-15 — Cross-Agent Sync Note

- Known frontend contract bugs in `frontend/src/App.jsx`:
  - Render team names from `homeTeam` / `awayTeam` directly because they are plain strings, not objects with `.name`.
  - Use `match.matchId` for React list keys instead of `match.id`.
- Keep this in mind for any future UI fixes, QA follow-up, or schema coordination with Ramos.

## 2026-06-15 — Tailwind dashboard delivery

- Completed a full `frontend/src/App.jsx` rewrite around Tailwind utility classes.
- Added a sticky gradient header, polished match cards, status pills, and a generic highlight CTA with `lucide-react` Youtube/Play fallback.
- Kept highlight rendering gated to `FINISHED` matches with a truthy `highlightUrl` and preserved spoiler-free output.
- Validation note from execution: frontend build passed.
