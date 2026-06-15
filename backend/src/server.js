import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { getMatches, initDB, updateMatchWatched } from './services/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/api/matches', async (req, res) => {
  try {
    const matches = await getMatches();
    res.json(matches);
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

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

start();
