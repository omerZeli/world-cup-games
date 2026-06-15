import axios from 'axios';

export async function fetchHighlightUrl(homeTeamHebrew, awayTeamHebrew) {
  const query = `מונדיאל 2026 תקציר ${homeTeamHebrew} נגד ${awayTeamHebrew} כאן 11`;

  try {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        regionCode: 'IL',
        maxResults: 1,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const videoId = data.items[0]?.id?.videoId;

    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  } catch (error) {
    console.log(`⚠️  YouTube API error: ${error.message}`);
    return null;
  }
}
