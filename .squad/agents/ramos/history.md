# Ramos — History

## Project Context

- **Project:** World Cup 2026 Daily Tracker & Highlights System
- **Owner:** omerZeli
- **Stack:** Node.js · Playwright · PostgreSQL (Supabase/Neon) · React/Vite · GitHub Actions
- **My Role:** Backend Dev
- **Critical Constraint:** STRICTLY SPOILER-FREE — drop score/goal/outcome fields at the API boundary, NEVER pass downstream

## Key Technical Details

- **YouTube scrape query (Hebrew):** `מונדיאל 2026 תקציר [Team 1] נגד [Team 2]`
- **Date windows:** `date-fns` to calculate past 24h and next 24h from UTC now
- **Phase 2 output:** `data.json` (local) — schema is a contract with Ronaldo's frontend
- **Phase 3 target:** Supabase or Neon managed PostgreSQL

## Team

- Zidane — Lead (I defer to architecture decisions)
- Navas — Tests what I build (I write unit tests for my functions, Navas owns integration strategy)
- Modric — Deploys what I write to CI/CD

## Learnings

<!-- Ramos's personal learnings accumulate here -->


## 2026-06-15 — Backend codebase deep-dive (current implementation)

I now understand the backend as a small spoiler-safe ingestion + serving pipeline with two execution surfaces:
- `server.js` is the read API for the frontend.
- `worker.js` is the write/update pipeline that populates PostgreSQL.

### What the backend does end-to-end

The system fetches World Cup matches from Football Data API, keeps only the time-relevant matches around “now”, enriches finished matches with a YouTube highlights URL, stores the normalized result in PostgreSQL, and exposes the stored rows through a simple Express endpoint.

The most important architectural rule is still **spoiler prevention**: backend intentionally keeps the match shape narrow and avoids score/result data in the stored/served payload. The canonical public shape is:
- `matchId`
- `homeTeam`
- `awayTeam`
- `utcDate`
- `status`
- `highlightUrl` (nullable, DB/API only when present)

### File-by-file mental model

#### `server.js`
This is the thin HTTP layer. It:
- loads env with `dotenv`
- creates an Express 5 app
- enables `cors()`
- enables `express.json()`
- exposes `GET /api/matches`
- delegates all data access to `getMatches()` from `services/db.js`
- returns raw rows as JSON sorted by kickoff time
- catches fetch failures and responds with HTTP 500 plus a generic error message

Operationally, `server.js` does not know how ingestion works; it only knows how to read from the database. That separation is good because the API stays simple and frontend-safe.

#### `worker.js`
This is the data pipeline runner. Its job is:
1. `initDB`
2. `fetchMatches`
3. split/filter into finished vs upcoming/time-relevant matches
4. for finished matches, translate team names to Hebrew and scrape a highlight URL from YouTube
5. `upsertMatches`

Important worker behavior:
- it inserts random 1–3 second delays between Playwright calls to reduce scraping burstiness
- it logs counts, URLs, and warnings for observability
- it treats highlight scraping as best-effort enrichment, not a reason to fail the entire sync

This means the database is the durable cache/materialized view, while the worker is the only writer.

#### `services/footballApi.js`
This module owns upstream match ingestion.
- endpoint: `https://api.football-data.org/v4/matches`
- auth header: `X-Auth-Token` from `FOOTBALL_API_KEY`
- requests a **wide** date range of ±2 calendar days using YYYY-MM-DD params
- then does an in-memory filter to the **precise** ±24h ISO window

The wide-then-precise strategy matters because day boundaries and API date filtering are calendar-based, while product logic is rolling 24 hours.

`mapMatch()` is a key safety boundary: it strips the upstream response down to spoiler-safe fields only.
That mapper is effectively part of the product contract and should not be casually expanded.

Rate-limit handling is built in:
- reads `x-requestsavailable`
- reads `x-requestcounter-reset`
- if remaining requests drop below `FOOTBALL_API_RATE_LIMIT_THRESHOLD` (default `2`), it pauses before continuing

Also important: error logging intentionally avoids dumping the upstream response body, which is safer and less noisy.

#### `services/db.js`
This module owns PostgreSQL connectivity and persistence.
- uses `pg` `Pool`
- connects through `DATABASE_URL`
- creates/targets a `matches` table with columns:
  - `matchId` INTEGER PRIMARY KEY
  - `homeTeam` TEXT NOT NULL
  - `awayTeam` TEXT NOT NULL
  - `utcDate` TEXT NOT NULL
  - `status` TEXT NOT NULL
  - `highlightUrl` TEXT nullable

Behavior:
- `upsertMatches` uses `INSERT ... ON CONFLICT ("matchId") DO UPDATE`
- on conflict it refreshes mutable fields like `status` and `highlightUrl`
- `getMatches` does `SELECT * ORDER BY utcDate ASC`

Practical takeaway: match identity is stable by `matchId`, and status/highlight are expected to evolve across sync runs.

#### `services/youtubeScraper.js`
This module owns highlight discovery.
- uses Playwright with headless Chromium
- browser identity mimics Chrome 124 on Windows
- locale is `he-IL`
- query format is: `מונדיאל 2026 תקציר {homeHebrew} נגד {awayHebrew}`
- waits for `a#video-title` up to 10 seconds
- returns a full YouTube URL or `null`

This is clearly a heuristic scraper, not an official API integration. It is sensitive to YouTube DOM/query-result changes, localization, and network timing.

#### `utils/teamsTranslator.js`
This is the normalization layer for team names before search.
- contains a 40+ entry English→Hebrew dictionary
- explicitly handles naming variants like `Türkiye`/`Turkey`, `Curaçao`/`Curacao`, `IR Iran`/`Iran`
- falls back to the original English name if there is no dictionary hit

The fallback is important: missing translations should degrade search quality, not crash the worker.

#### `utils/time.js`
This module centralizes time window calculations.
- `getYesterdayISO()` / `getTomorrowISO()` are for precise ±24h filtering
- `get2DaysAgoDate()` / `get2DaysFromNowDate()` are for the wider API request window

This split prevents time logic from being duplicated between API fetch and in-memory filtering.

### Runtime contract / environment variables

Required:
- `FOOTBALL_API_KEY` — required for Football Data API auth
- `DATABASE_URL` — required PostgreSQL connection string used by `pg`

Optional:
- `PORT` — defaults to `3000`
- `FOOTBALL_API_RATE_LIMIT_THRESHOLD` — defaults to `2`

If `DATABASE_URL` is missing, the read API and worker persistence path are both effectively broken.
If `FOOTBALL_API_KEY` is missing, ingestion cannot happen.

### Dependency picture

Main runtime deps currently are:
- `axios`
- `cors`
- `date-fns`
- `dotenv`
- `express@5`
- `pg`
- `playwright`

This is a lightweight backend with one HTTP server, one DB client, one scraper, and one date utility layer.

### Things to watch out for

1. **Spoiler leakage risk**
   - The biggest product risk is accidentally expanding `mapMatch()` or DB/API payloads with score/result fields.
   - Any schema or API expansion must be reviewed through the spoiler-free requirement first.

2. **Worker/scraper fragility**
   - YouTube scraping depends on selectors, query wording, locale behavior, and page timing.
   - Finished matches may legitimately persist with `highlightUrl = null`.

3. **Rate limits**
   - Football Data API quota handling exists, but future concurrency increases or retry loops could still create pressure.
   - Threshold behavior is configurable and should stay conservative.

4. **Time-window correctness**
   - The current design intentionally mixes a broad calendar fetch with an exact rolling 24h filter.
   - Any refactor here must preserve that distinction or edge matches around midnight/UTC boundaries can be lost.

5. **DB connection lifecycle**
   - `pg` pool is never explicitly closed.
   - `server.js` has no graceful shutdown path yet, so long-lived processes are fine, but clean exits are incomplete.

6. **Data typing**
   - `utcDate` is stored as `TEXT`, not `TIMESTAMP`.
   - Lexicographic ordering works for ISO strings, so current ordering is acceptable, but richer SQL date operations would be awkward later.

### Known gaps / bugs I should remember

- `.env.example` is missing `DATABASE_URL`
- there is no GitHub Actions workflow yet to run the worker on a daily schedule
- DB pool shutdown is not implemented
- `utcDate` is text-based storage by design-for-now, not ideal long-term

### My backend ownership model going forward

If I touch this area again, I should think in these boundaries:
- `footballApi.js` = ingest + rate-limit-safe normalization boundary
- `youtubeScraper.js` + `teamsTranslator.js` = highlight enrichment boundary
- `db.js` = persistence boundary
- `worker.js` = orchestration boundary
- `server.js` = read-only delivery boundary

That mental model is the cleanest way to keep future changes small, spoiler-safe, and testable.

## 2026-06-15 — Cross-Agent Sync Note

- Frontend bug to remember when discussing the backend contract: `frontend/src/App.jsx` expects `homeTeam.name` and `awayTeam.name`, but the backend returns plain string fields (`homeTeam`, `awayTeam`).
- The frontend also keys matches with `match.id`, while backend records and API payloads expose `match.matchId`.
- Treat this mismatch as known integration context for future backend/frontend coordination.
