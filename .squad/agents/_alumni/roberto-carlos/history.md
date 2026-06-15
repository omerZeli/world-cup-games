# Roberto Carlos — History

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

## Key Decisions to Make

- Supabase vs Neon (Pelé decides, I implement)
- Workflow trigger: `schedule` + manual `workflow_dispatch` for testing
- Free-tier GitHub Actions minute budget awareness

## Team

- Pelé — Makes cloud provider decision
- Zidane — Writes the worker I run in CI
- Ronaldinho — I configure Vercel for their frontend

## Learnings

<!-- Roberto Carlos's personal learnings accumulate here -->
