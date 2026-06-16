import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getLastWorkerRun,
  getMatches,
  initDB,
  updateMatchWatched
} from './services/db.js';
import { run as runWorker } from './worker.js';
import { getYesterdayISO, getTomorrowISO } from './utils/time.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3000;
let isWorkerRunning = false;

app.use(cors());
app.use(express.json());

app.get('/api/matches', async (req, res) => {
  try {
    const matches = await getMatches();
    const windowStart = new Date(getYesterdayISO()).getTime();
    const windowEnd   = new Date(getTomorrowISO()).getTime();
    const filtered = matches.filter((m) => {
      const t = new Date(m.utcDate).getTime();
      return t >= windowStart && t <= windowEnd;
    });
    res.json(filtered);
  } catch (error) {
    console.error('Failed to fetch matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.patch('/api/matches/:id/watched', async (req, res) => {
  const { watched } = req.body;

  if (typeof watched !== 'boolean') {
    return res.status(400).json({ error: 'watched must be a boolean' });
  }

  try {
    const match = await updateMatchWatched(req.params.id, watched);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    return res.json(match);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update watched status' });
  }
});

app.get('/api/worker/last-run', async (req, res) => {
  try {
    const lastRun = await getLastWorkerRun();

    if (!lastRun) {
      return res.json({ ran_at: null });
    }

    return res.json({
      ran_at: lastRun.ran_at instanceof Date ? lastRun.ran_at.toISOString() : lastRun.ran_at,
      triggered_by: lastRun.triggered_by
    });
  } catch (error) {
    console.error('Failed to fetch worker last run:', error.message);
    return res.status(500).json({ error: 'Failed to fetch worker last run' });
  }
});

app.post('/api/worker/run', async (req, res) => {
  if (isWorkerRunning) {
    return res.status(409).json({ error: 'Worker is already running' });
  }

  isWorkerRunning = true;

  try {
    const lastRun = await runWorker('manual');
    return res.json({
      ran_at: lastRun.ran_at instanceof Date ? lastRun.ran_at.toISOString() : lastRun.ran_at,
      triggered_by: lastRun.triggered_by
    });
  } catch (error) {
    console.error('Manual worker run failed:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    isWorkerRunning = false;
  }
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

start();
