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

