# ⚽ World Cup 2026 Daily Tracker & Highlights

Automated, spoiler-free match tracking and Hebrew highlights for the 2026 World Cup — powered by daily data syncs, YouTube discovery, and a responsive React dashboard.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase%20%7C%20Neon-4169E1?logo=postgresql&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Daily%20Automation-2088FF?logo=githubactions&logoColor=white)

> [!IMPORTANT]
> **Strictly spoiler-free by design.** Final scores, goals, and match outcomes stay hidden until a user explicitly marks a match as **watched**. Users can safely browse schedules and highlights without accidental spoilers.

## Features

- Daily automated match updates via GitHub Actions (`daily-worker.yml`, runs `node src/worker.js`)
- Spoiler-free match cards with hidden scores
- Split views for **Finished** and **Upcoming** matches
- Hebrew YouTube highlight links for finished matches
- Per-match **watch toggle** to reveal the score and compact the card
- Responsive React dashboard with RTL (Hebrew) layout
- Simple REST API:
  - `GET /api/matches`
  - `PATCH /api/matches/:id/watched`

## Architecture

```text
GitHub Actions (cron: 06:00 UTC)
              |
              v
      backend/src/worker.js
        /                \
       v                  v
football-data.org   YouTube Data API
                         |
                         v
               PostgreSQL (Supabase / Neon)
                         |
                         v
            Express API (backend/src/server.js)
                         |
                         v
          React + Vite Frontend (spoiler-free UI)
```

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios, `lucide-react` |
| Backend | Node.js, Express |
| Data Sources | football-data.org API, YouTube Data API |
| Database | PostgreSQL via `DATABASE_URL` (Supabase / Neon) |
| Automation | GitHub Actions |
| UX | Responsive layout, RTL Hebrew interface, spoiler-free reveal flow |

## Getting Started

### Prerequisites

- Node.js **20+**
- npm
- PostgreSQL database, or a hosted Postgres provider such as **Supabase** or **Neon**
- API keys for football-data.org and YouTube Data API v3

### Clone & Install

```bash
git clone https://github.com/omerZeli/world-cup-games.git
cd world-cup-games
npm run build
```

### Environment Variables

Create environment files for the backend as needed and provide the following variables:

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the backend and worker | `postgresql://user:password@host:5432/worldcup` |
| `FOOTBALL_API_KEY` | API key for fetching official match schedule/data from football-data.org | `fdc_xxxxxxxxxxxxx` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key for highlight discovery | `AIzaSyxxxxxxxxxxxxx` |

### Build

```bash
npm run build
```

This root script:

- installs frontend dependencies
- builds the Vite frontend
- installs backend dependencies

### Run

```bash
npm start
```

This starts the Express API from the backend:

```bash
npm --prefix backend start
```

## GitHub Actions / Automation

The repository includes a scheduled workflow at:

```text
.github/workflows/daily-worker.yml
```

It runs every day at **06:00 UTC** and executes the worker to:

1. fetch scheduled and finished matches from football-data.org
2. search for Hebrew highlight videos
3. persist fresh data into PostgreSQL
4. keep the frontend-ready dataset up to date without manual intervention

Additional squad automation workflows are also included for project operations.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/matches` | Returns matches for the dashboard |
| `PATCH` | `/api/matches/:id/watched` | Marks a match as watched so score details can be revealed |

## Contributing

Contributions are welcome. Keep the core product principle intact: **never expose spoilers unless the user explicitly chooses to reveal them.**
