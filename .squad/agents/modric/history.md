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

