import dotenv from 'dotenv';
import { fetchMatches } from './services/footballApi.js';
import { translateTeam } from './utils/teamsTranslator.js';
import { fetchHighlightUrl } from './services/youtubeApi.js';
import { initDB, upsertMatches } from './services/db.js';

dotenv.config();

async function run() {
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
}

run().catch((error) => {
  console.error(`Worker failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
