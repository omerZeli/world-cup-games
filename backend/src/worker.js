import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchMatches } from './services/footballApi.js';
import { translateTeam } from './utils/teamsTranslator.js';
import { fetchHighlightUrl } from './services/youtubeApi.js';
import { initDB, recordWorkerRun, upsertMatches } from './services/db.js';

dotenv.config();

export async function run(triggeredBy = 'scheduled') {
  await initDB();
  const matches = await fetchMatches();
  console.log(`Fetched ${matches.length} matches`);

  const finishedMatches  = matches.filter((m) => m.status === 'FINISHED');
  const upcomingMatches  = matches.filter((m) => m.status !== 'FINISHED');

  console.log(
    `📋 ${finishedMatches.length} finished  |  ${upcomingMatches.length} upcoming`
  );

  for (const match of finishedMatches) {
    const homeHebrew = translateTeam(match.homeTeam);
    const awayHebrew = translateTeam(match.awayTeam);

    console.log(`🔍 Searching highlights: ${homeHebrew} נגד ${awayHebrew}`);

    match.highlightUrl = await fetchHighlightUrl(homeHebrew, awayHebrew);

    if (match.highlightUrl) {
      console.log(`   ✅ ${match.highlightUrl}`);
    } else {
      console.warn(`   ⚠️  No highlight found for ${match.homeTeam} vs ${match.awayTeam}`);
    }
  }

  const allMatches = [...upcomingMatches, ...finishedMatches];

  await upsertMatches(allMatches);
  return recordWorkerRun(triggeredBy);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run('scheduled').catch((error) => {
    console.error(`Worker failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
