import axios from 'axios';
import { getYesterdayISO, getTomorrowISO, get2DaysAgoDate, get2DaysFromNowDate } from '../utils/time.js';

const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_RATE_LIMIT_THRESHOLD = 2;

export function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

// ⚠️ SPOILER-FREE: only these five fields pass through — never scores, goals, or winners
function mapMatch(match) {
  return {
    matchId:  match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    utcDate:  match.utcDate,
    status:   match.status,
  };
}

async function applyRateLimitDelay(headers, threshold = DEFAULT_RATE_LIMIT_THRESHOLD) {
  const requestsAvailable = Number(headers['x-requestsavailable']);
  const resetSeconds      = Number(headers['x-requestcounter-reset']);

  if (
    Number.isFinite(requestsAvailable) &&
    Number.isFinite(resetSeconds) &&
    requestsAvailable < threshold
  ) {
    console.warn(
      `⏸  Rate limit low (${requestsAvailable} remaining). Pausing ${resetSeconds}s.`
    );
    await sleep(resetSeconds);
  }
}

function getRateLimitThreshold() {
  const configured = Number(process.env.FOOTBALL_API_RATE_LIMIT_THRESHOLD);
  return Number.isFinite(configured) ? configured : DEFAULT_RATE_LIMIT_THRESHOLD;
}

// Keeps only matches whose utcDate falls strictly within the precise 24h window.
function filterToPreciseWindow(matches, windowStartISO, windowEndISO) {
  const start = new Date(windowStartISO).getTime();
  const end   = new Date(windowEndISO).getTime();

  return matches.filter((match) => {
    const matchTime = new Date(match.utcDate).getTime();
    return matchTime >= start && matchTime <= end;
  });
}

export async function fetchMatches() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) throw new Error('FOOTBALL_API_KEY is not set.');

  const rateLimitThreshold = getRateLimitThreshold();

  // Precise window boundaries for in-memory filtering
  const windowStart = getYesterdayISO();
  const windowEnd   = getTomorrowISO();

  // Wider date range for the API request — avoids missing matches at UTC day boundaries
  const dateFrom = get2DaysAgoDate();
  const dateTo   = get2DaysFromNowDate();

  try {
    const response = await axios.get(`${BASE_URL}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params:  { dateFrom, dateTo },
    });

    await applyRateLimitDelay(response.headers, rateLimitThreshold);

    const raw = Array.isArray(response.data?.matches) ? response.data.matches : [];

    // 1. Precision-filter to the exact 24h window in memory
    const inWindow = filterToPreciseWindow(raw, windowStart, windowEnd);

    // 2. Map to spoiler-free objects (score/goals/winner never leave this function)
    return inWindow.map(mapMatch);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Deliberately NOT logging response body — it may contain score data
      console.error(`Football API error ${error.response?.status ?? 'unknown'}: ${error.message}`);
    } else {
      console.error(`Football API error: ${error?.message ?? String(error)}`);
    }
    throw error;
  }
}
