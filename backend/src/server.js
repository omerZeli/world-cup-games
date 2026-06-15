import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMatches, initDB, updateMatchWatched } from './services/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
