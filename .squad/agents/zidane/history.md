# Zidane — History

## Project Context

- **Project:** World Cup 2026 Daily Tracker & Highlights System
- **Owner:** omerZeli
- **Stack:** Node.js · Playwright · PostgreSQL (Supabase/Neon) · React/Vite · GitHub Actions
- **My Role:** Lead & Architect (promoted from Backend Dev — 2026-06-15)
- **Critical Constraint:** STRICTLY SPOILER-FREE — no scores, goals, or outcomes ever stored or displayed

## Phases to Lead

1. Phase 1 — Core Node.js worker (date-fns windows, football API, Playwright scraping)
2. Phase 2 — Local `data.json` output (perfect logic before adding DB)
3. Phase 3 — Cloud Postgres migration (Supabase or Neon)
4. Phase 4 — React/Vite frontend SPA
5. Phase 5 — GitHub Actions cron automation

## Team

- Ramos — Backend Dev (worker, scraping, API, DB)
- Ronaldo — Frontend Dev (React/Vite SPA)
- Modric — DevOps (GitHub Actions, cloud DB, CI/CD)
- Navas — Tester/QA (spoiler-leak tests, edge cases)

## Learnings

<!-- Zidane's personal learnings accumulate here -->


## 2026-06-15 — Consolidated project memory: World Cup 2026 Daily Tracker & Highlights System

I designed this project around one non-negotiable product rule: the entire experience must remain strictly spoiler-free. The system exists to tell users which World Cup 2026 matches are relevant for the day and, once appropriate, provide a highlights link — without ever exposing scores, goals, winners, or any match outcome details. That constraint shaped every layer of the architecture: ingestion, persistence, API shape, logging discipline, and frontend rendering.

### Product and system intent
My goal with this codebase is to provide a simple daily tracker for World Cup matches plus a safe path to Hebrew-language highlights for finished games. The primary audience is Hebrew-speaking users who want lightweight match awareness and convenient highlight access without accidental spoilers. Because of that, I intentionally kept the data model narrow and refused to store anything that could later leak outcomes.

### High-level architecture
I split the system into two backend runtimes plus a frontend SPA:

1. **Worker runtime** (`backend/src/worker.js`)
   - Runs on a daily schedule through GitHub Actions.
   - Fetches match data from `football-data.org`.
   - Filters the results down to the exact day window I care about.
   - For finished matches only, searches YouTube for Hebrew highlight URLs.
   - Upserts the spoiler-free match records into PostgreSQL.

2. **API server** (`backend/src/server.js`)
   - Express-based, intentionally minimal.
   - Exposes a single read endpoint: `GET /api/matches`.
   - Reads already-sanitized data from PostgreSQL and returns it to the frontend.

3. **Frontend SPA** (`frontend/`)
   - Built with React 19 and Vite.
   - Calls `/api/matches` through the Vite proxy that forwards to `localhost:3000`.
   - Renders match cards showing teams, kickoff time, status, and highlight link when available.

This separation lets ingestion concerns, API serving, and UI concerns evolve independently while keeping the spoiler-free contract centralized in the backend data flow.

### Core spoiler-free strategy
The most important design decision lives in `backend/src/services/footballApi.js`, specifically the match mapping layer. I intentionally strip the upstream payload down to the only fields the product is allowed to know about:
- `matchId`
- `homeTeam`
- `awayTeam`
- `utcDate`
- `status`

I do **not** propagate scores, goals, winners, scoreline breakdowns, or any equivalent derived outcome data. This is not just a frontend concern; it is enforced at ingestion time so sensitive fields never become part of the app’s normal data model.

I carried that same rule into persistence:
- The `matches` table contains no score-related columns.
- The API only reads and returns spoiler-safe fields.
- The frontend has no legitimate source from which it could display outcome data.

I also kept logging deliberately conservative. In particular, error handling avoids dumping upstream response bodies because those bodies could contain match outcomes. That means operational diagnostics are slightly less rich, but it preserves the product’s core trust guarantee.

### Data ingestion flow I established
The ingestion path is intentionally linear and easy to reason about:
1. `fetchMatches()` calls `football-data.org`.
2. I request a **wide date window** rather than a razor-thin one.
3. I then apply a **precise 24-hour filter in memory**.
4. For matches with status `FINISHED`, I attempt highlight discovery.
5. I translate team names from English to Hebrew.
6. I search YouTube for a Hebrew highlight result and capture a URL.
7. I upsert the final spoiler-free record into PostgreSQL.
8. The API serves that stored record to the React client.

The wide-window-plus-precise-filter approach is deliberate. I added it to avoid UTC boundary misses and date edge cases that can happen when provider-side filtering and local expectations do not line up exactly.

### Why I chose the wide date window approach
Football scheduling APIs can be surprisingly tricky around time zones and calendar boundaries. Instead of trusting an exact upstream window to always align with the day the user cares about, I fetch with slack (±2 days) and then perform the precise inclusion test locally. That makes the system more resilient to:
- UTC rollover ambiguity
- Off-by-one-day issues
- Provider-side interpretation differences
- Daylight-saving-related confusion in downstream presentation

This is one of the core reliability decisions in the worker.

### Rate limit handling philosophy
I built the football-data client to be rate-limit-aware rather than naively retrying until it breaks. The service reads headers such as:
- `x-requestsavailable`
- `x-requestcounter-reset`

If the remaining budget gets too low, the worker pauses instead of rushing into avoidable failures. That matters because this project is scheduled and unattended; graceful pacing is better than noisy crashes. I want the worker to behave like a good citizen toward the upstream provider.

### Highlight discovery design
The highlight enrichment step lives in `backend/src/services/youtubeScraper.js` and uses Playwright. I chose Playwright because the YouTube results surface is dynamic enough that browser automation is more reliable than brittle static scraping.

The search query is intentionally localized for the target audience:
- `מונדיאל 2026 תקציר {homeHebrew} נגד {awayHebrew}`

That design leans into Hebrew-language search relevance, increasing the odds that the returned highlight is what Israeli users actually want.

I also added practical anti-bot precautions:
- Chromium runs with `he-IL` locale.
- The scraper uses a realistic User-Agent.
- I insert a random 1–3 second delay between sessions.

These choices are not about aggressive scraping scale; they are about keeping a lightweight, polite enrichment step stable enough for a daily scheduled workflow.

### Team translation layer
The English-to-Hebrew mapping in `backend/src/utils/teamsTranslator.js` is a key product detail, not just a utility. It ensures the YouTube search phrases sound native and keeps terminology aligned with how users search in Hebrew. My current understanding is that this dictionary already covers 40+ teams, which is sufficient for the tournament-oriented use case, though it remains a maintenance point if naming variants show up.

### Database layer and API contract
The PostgreSQL layer in `backend/src/services/db.js` is responsible for:
- initializing the schema,
- upserting match rows, and
- reading the current match list.

The important architectural rule here is that the database is the source of truth for already-sanitized match metadata plus optional `highlightUrl`. The API server does not perform enrichment and should stay thin. `backend/src/server.js` exists primarily to expose that persisted state through a clean endpoint on `PORT`.

### Frontend structure and intent
The frontend is a Vite SPA using React 19. Its job is intentionally simple: request `/api/matches`, render cards, and stay visually lightweight. The Vite proxy in `frontend/vite.config.js` points local API calls at `localhost:3000`, which keeps the frontend development experience straightforward and avoids CORS friction during local work.

`frontend/src/App.jsx` currently owns the main rendering flow, including the `MatchCard` usage. The UI concept is sound, but I have identified a couple of implementation mismatches that need correction.

### Known bugs / current codebase defects I have identified
There are several concrete issues I now consider part of my active memory of the codebase state:

1. **Incorrect team field access in `frontend/src/App.jsx`**
   - The UI currently uses `{homeTeam.name}` and `{awayTeam.name}`.
   - The backend/database contract returns `homeTeam` and `awayTeam` as plain text strings, not nested objects.
   - The correct rendering should use `{homeTeam}` and `{awayTeam}`.

2. **Incorrect React key in `frontend/src/App.jsx`**
   - The list currently uses `key={match.id}`.
   - The data model uses `matchId`, not `id`.
   - The correct key should be `key={match.matchId}`.

3. **Frontend styling is still scaffold boilerplate**
   - `frontend/src/App.css` is still generic Vite starter styling.
   - It does not yet express the actual product identity or UX priorities.
   - This is not a runtime bug, but it is a clear incompleteness in the implementation.

4. **Environment template is incomplete**
   - `.env.example` currently includes only `FOOTBALL_API_KEY`.
   - It is missing `DATABASE_URL`.
   - This creates onboarding friction and makes environment setup less self-documenting than it should be.

### Current repository state as I understand it
At this point, I see the codebase as a mostly coherent end-to-end slice with a strong architectural backbone and a few obvious correctness and polish gaps:
- The overall product direction is clear and well-constrained.
- The spoiler-free principle is enforced in the right place: at data ingestion and schema design.
- The worker/API/frontend split is appropriate for the scope.
- The YouTube enrichment strategy is practical and audience-aware.
- The remaining issues are mostly at the integration edges and developer-experience layer.

In other words: the system concept is solid, the backend shape is disciplined, and the highest-priority follow-up work is to fix the frontend contract mismatches and tighten setup/documentation details.

### My intended maintenance posture going forward
When I touch this project, I should preserve these principles:
- Never let outcome-bearing fields enter the app’s stored or served model.
- Keep the API surface minimal and spoiler-safe.
- Prefer resilient date filtering over brittle assumptions at provider boundaries.
- Treat Hebrew localization as a product feature, not an afterthought.
- Keep the scraping step conservative and stable rather than ambitious.
- Fix frontend issues in ways that honor the backend contract rather than reshaping the data model unnecessarily.

### Immediate next fixes I would prioritize
If I continue implementation work from here, my first fixes would be:
1. Correct `App.jsx` to render `homeTeam` / `awayTeam` as strings.
2. Change React list keys from `match.id` to `match.matchId`.
3. Replace the Vite boilerplate CSS with project-specific styling.
4. Add `DATABASE_URL` to `.env.example`.

This entry reflects my full current mental model of the project: a spoiler-free daily World Cup tracker with scheduled ingestion, localized highlight discovery, PostgreSQL persistence, a thin Express API, and a React frontend that needs a small round of contract-alignment and polish.

## 2026-06-15 — Cross-Agent Sync Note

- Shared bug context for planning and reviews: `frontend/src/App.jsx` is currently out of contract with the backend payload. `homeTeam` and `awayTeam` arrive as plain strings, not nested objects, so `.name` access is broken.
- Match identity also comes from `match.matchId`, not `match.id`, so frontend list rendering should key from `match.matchId`.
- This should be considered a team-wide known issue when assigning frontend, QA, or integration work.
