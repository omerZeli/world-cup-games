# Modric — History

## Project Context

- **Project:** World Cup 2026 Daily Tracker & Highlights System
- **Owner:** omerZeli
- **Stack:** GitHub Actions · Supabase or Neon (PostgreSQL) · Vercel · Node.js/Playwright (via CI)
- **My Role:** DevOps / Platform Engineer
- **Critical Constraint:** Cron must be idempotent — running twice a day must not duplicate data

## Infrastructure Plan

- **Phase 3:** Provision cloud PostgreSQL (Supabase free tier or Neon free tier)
- **Phase 5:** GitHub Actions workflow with daily cron (`schedule: cron`)
  - Install Node.js + Playwright Chromium
  - Run worker → update DB
  - Secrets: `API_KEY`, `DATABASE_URL` as GitHub Secrets
- **Frontend deploy:** Vercel auto-deploy on push to `main`

## Team

- Zidane — Makes architecture/cloud provider decisions
- Ramos — Writes the worker I run in CI
- Ronaldo — I configure Vercel for their frontend

## Learnings

<!-- Modric's personal learnings accumulate here -->


## 2026-06-15 — Infrastructure State Baseline Captured

- I documented the repo as a split app: `backend/` is a Node.js ESM service with an Express API plus a one-shot worker, `frontend/` is a React 19 + Vite SPA, `data/` is currently reserved only with `.gitkeep`, `.github/workflows/` currently contains only Squad automation workflows, and `.squad/` holds team state with union-merge protection.
- Current GitHub Actions state is still project-ops only: `squad-heartbeat.yml`, `squad-issue-assign.yml`, `squad-triage.yml`, and `sync-squad-labels.yml`. There is no application CI yet, no scheduled workflow to run `node src/worker.js`, and no deployment pipeline for either app surface.
- Backend runtime requirements are now clear in my platform notes: `FOOTBALL_API_KEY` for football-data.org, `DATABASE_URL` for PostgreSQL, optional `PORT` defaulting to `3000`, and optional `FOOTBALL_API_RATE_LIMIT_THRESHOLD` defaulting to `2` to back off before exhausting the free-tier API budget.
- I noted an onboarding/config gap: repository root `.env.example` only documents `FOOTBALL_API_KEY`, but new contributors also need `DATABASE_URL`. That omission will cause local worker/server startup confusion until the example env file is expanded.
- Database shape is straightforward PostgreSQL via the `pg` pool. The worker boot path calls `initDB()` on every run, using an idempotent `CREATE TABLE IF NOT EXISTS matches (...)` schema with `matchId` as primary key and columns for teams, UTC date, status, and optional highlight URL.
- Worker execution model is important operationally: `backend/src/worker.js` is not a daemon. It is designed as a one-shot job for either manual execution with `npm run worker` from `backend/` or a future scheduled GitHub Actions cron.
- Local dev expectations are pinned down: backend runs from `backend/` with `npm install` then `npm run dev`; frontend runs from `frontend/` with `npm install` then `npm run dev`; Vite serves on `:5173` and proxies `/api` to `:3000`, so the backend must be up for end-to-end local behavior.
- I captured the CI gotcha around Playwright: because `playwright` lives in backend dependencies, any workflow that executes the worker in CI must install browser binaries first, specifically `npx playwright install chromium`, or the worker path will fail in automation even if package install succeeded.
- Merge behavior for Squad state is protected via `.gitattributes` union rules for `.squad/decisions.md`, `.squad/agents/*/history.md`, `.squad/log/**`, `.squad/orchestration-log/**`, and `.squad/rai/audit-trail.md`. That means append-only operational notes are expected to merge cleanly across parallel agent work.
- Recommended deployment topology from a platform perspective: backend can land cleanly on Render or Railway for always-on HTTP plus ad hoc/manual job execution; frontend is a natural fit for Vercel or Netlify; PostgreSQL should live on Supabase or Neon depending whether the team prefers broader BaaS ergonomics or a slimmer hosted Postgres experience.
- Missing workflow backlog I would own if asked to implement it: (1) daily cron workflow to install backend deps, install Playwright Chromium, and run `node src/worker.js`; (2) CI workflow for backend/frontend validation on push and pull request; (3) deployment workflows or provider-native auto deploy wiring for backend and frontend.
- Net result: infra foundations are still early-stage but coherent — app structure is clear, DB contract is simple, local dev is conventional, and the main platform work remaining is automation, secret hygiene, and environment documentation.

## 2026-06-15 — Cross-Agent Sync Note

- Important integration bug context: the frontend currently mismatches the backend payload in `frontend/src/App.jsx` by reading `homeTeam.name` / `awayTeam.name` even though the API returns plain strings.
- The same file also uses `match.id` instead of `match.matchId` for React keys.
- Keep this in mind when wiring CI, preview deployments, and any smoke-test expectations.
2026-06-15 — Created root package.json with Render build/start scripts for monorepo deployment as single Web Service.

## 2026-06-15 — Daily worker cron workflow created

- Created `.github/workflows/daily-worker.yml` for `worker.js`.
- Runs at `0 6 * * *` UTC (9AM IST).
- Includes `workflow_dispatch` for manual runs.
- Uses Node 20 and installs Playwright Chromium before execution.
- Injects `DATABASE_URL` and `FOOTBALL_API_KEY` secrets into the job.
