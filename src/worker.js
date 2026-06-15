import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { fetchMatches } from './services/footballApi.js';
import { translateTeam } from './utils/teamsTranslator.js';
import { scrapeHighlightUrl } from './services/youtubeScraper.js';

dotenv.config();

const DATA_FILE = 'data.json';

function randomDelay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
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

    match.highlightUrl = await scrapeHighlightUrl(homeHebrew, awayHebrew);

    if (match.highlightUrl) {
      console.log(`   ✅ ${match.highlightUrl}`);
    } else {
      console.warn(`   ⚠️  No highlight found for ${match.homeTeam} vs ${match.awayTeam}`);
    }

    // Random 1-3 s delay between Playwright sessions to reduce bot-detection risk
    await randomDelay(1_000, 3_000);
  }

  const allMatches = [...upcomingMatches, ...finishedMatches];

  await writeFile(DATA_FILE, JSON.stringify(allMatches, null, 2), 'utf8');
  console.log(`\n💾 Saved ${allMatches.length} matches to ${DATA_FILE}`);
}

run().catch((error) => {
  console.error(`Worker failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
