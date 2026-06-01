import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

async function testRecentTracks() {
  if (!API_KEY) return console.error("Error: LASTFM_API_KEY is missing");

  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=5`;

  try {
    console.log(`Fetching recent tracks for ${USERNAME}...\n`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const tracks = data.recenttracks.track;

    console.log(
      `Successfully fetched data! Here is the JSON for a SINGLE scrobble:\n`,
    );

    const trackToInspect = tracks[0]["@attr"]?.nowplaying
      ? tracks[1]
      : tracks[0];

    console.log(JSON.stringify(trackToInspect, null, 2));
  } catch (error) {
    console.error("API Fetch Error:", error);
  }
}

testRecentTracks();
