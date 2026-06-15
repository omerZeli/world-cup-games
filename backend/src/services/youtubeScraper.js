import { chromium } from 'playwright';

const YOUTUBE_SEARCH_BASE = 'https://www.youtube.com/results?search_query=';
const VIDEO_TITLE_SELECTOR = 'a#video-title';
const SELECTOR_TIMEOUT_MS  = 10_000;

/**
 * Searches YouTube for a World Cup 2026 highlight video for the given match.
 *
 * @param {string} homeTeamHebrew  Hebrew name of the home team
 * @param {string} awayTeamHebrew  Hebrew name of the away team
 * @returns {Promise<string|null>}  Full YouTube URL, or null if nothing found
 */
export async function scrapeHighlightUrl(homeTeamHebrew, awayTeamHebrew) {
  const query     = `מונדיאל 2026 תקציר ${homeTeamHebrew} נגד ${awayTeamHebrew}`;
  const searchUrl = `${YOUTUBE_SEARCH_BASE}${encodeURIComponent(query)}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      // Helps avoid trivial bot-detection fingerprinting
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/124.0.0.0 Safari/537.36',
      locale: 'he-IL',
    });
    const page = await context.newPage();

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(VIDEO_TITLE_SELECTOR, { timeout: SELECTOR_TIMEOUT_MS });

    const href = await page.getAttribute(VIDEO_TITLE_SELECTOR, 'href');
    if (!href) return null;

    // href is a relative path like /watch?v=...
    return href.startsWith('http') ? href : `https://www.youtube.com${href}`;
  } catch (error) {
    console.error(
      `⚠️  YouTube scrape failed [${homeTeamHebrew} נגד ${awayTeamHebrew}]: ${error.message}`
    );
    return null;
  } finally {
    await browser?.close();
  }
}
