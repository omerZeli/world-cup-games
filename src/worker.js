import dotenv from 'dotenv';
import { fetchMatches } from './services/footballApi.js';

dotenv.config();

async function run() {
  const matches = await fetchMatches();
  console.log(`Fetched ${matches.length} matches`);
  console.table(matches);

  // TODO: Phase 2 - write spoiler-free matches to data.json.
}

run().catch((error) => {
  console.error(`Worker failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
