import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = 'ptrn23';

async function getWeeklyScrobbles() {
  if (!API_KEY) return console.error("Error: LASTFM_API_KEY is missing");

  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60);

  let page = 1;
  let totalPages = 1;
  const allScrobbles: any[] = [];

  console.log(`Fetching all scrobbles for the last 7 days...`);

  // 1. Fetching all pages
  while (page <= totalPages) {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=200&from=${sevenDaysAgo}&to=${now}&page=${page}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    const tracks = data.recenttracks.track;
    if (Array.isArray(tracks)) allScrobbles.push(...tracks);
    else if (tracks) allScrobbles.push(tracks);

    totalPages = parseInt(data.recenttracks['@attr'].totalPages);
    page++;
  }

  // 2. Reverse the array so it is in CHRONOLOGICAL order (Oldest -> Newest)
  // This is required to calculate streaks accurately!
  allScrobbles.reverse();

  // 3. The Aggregation Engine
  const aggregatedMap = new Map<string, any>();
  let previousKey = ""; // Track what played right before

  for (const scrobble of allScrobbles) {
    if (scrobble['@attr']?.nowplaying) continue;

    const songName = scrobble.name;
    const artistName = scrobble.artist['#text'];
    const uniqueKey = `${songName}|${artistName}`;

    // Initialize the song in our map if it doesn't exist yet
    if (!aggregatedMap.has(uniqueKey)) {
        aggregatedMap.set(uniqueKey, {
            song: songName,
            artist: artistName,
            album: scrobble.album['#text'],
            streams: 0,
            airplay: 0, // Max Streak
            sales: 0,   // Sessions
            _currentStreak: 0 // Internal counter, won't be in final output
        });
    }

    const metrics = aggregatedMap.get(uniqueKey);
    
    // 1. Always increment total streams
    metrics.streams += 1;

    // 2. Calculate Streaks & Sessions
    if (uniqueKey === previousKey) {
        // Song played on repeat! Add to current streak.
        metrics._currentStreak += 1;
    } else {
        // A new session has started for this song!
        metrics.sales += 1;
        metrics._currentStreak = 1; // Reset streak counter
    }

    // 3. Update Airplay (Max Streak) if the current streak broke the record
    if (metrics._currentStreak > metrics.airplay) {
        metrics.airplay = metrics._currentStreak;
    }

    // Update previousKey for the next loop iteration
    previousKey = uniqueKey;
  }

  // 4. Sort by total streams to get the Top 10
  const sortedChart = Array.from(aggregatedMap.values())
    .sort((a, b) => b.streams - a.streams);

  console.log(`\n🏆 YOUR TOP 10 METRICS THIS WEEK 🏆`);
  sortedChart.slice(0, 10).forEach((entry, index) => {
      console.log(`#${index + 1}: ${entry.song} by ${entry.artist}`);
      console.log(`    Streams: ${entry.streams} | Sales (Sessions): ${entry.sales} | Airplay (Max Streak): ${entry.airplay}\n`);
  });
}

getWeeklyScrobbles();