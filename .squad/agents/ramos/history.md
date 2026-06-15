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

