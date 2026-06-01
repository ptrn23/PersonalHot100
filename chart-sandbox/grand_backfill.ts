import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

// Polite delay function to prevent API bans
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runGrandBackfill() {
  console.log("🚀 Initializing The Grand Backfill...");

  const initialUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=200`;
  const initialResponse = await fetch(initialUrl);
  const initialData = await initialResponse.json();
  
  const totalPages = parseInt(initialData.recenttracks['@attr'].totalPages);
  const totalScrobbles = initialData.recenttracks['@attr'].total;
  
  console.log(`Found ${totalScrobbles} total scrobbles across ${totalPages} pages.`);
  console.log(`Starting chronological download (from Page ${totalPages} down to 1)...\n`);

  for (let page = 893; page >= 1; page--) {
    console.log(`\n📥 Fetching Page ${page} of ${totalPages}...`);
    
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=200&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error || !data.recenttracks) {
        console.error(`⚠️ Last.fm API Glitch: ${data.message || 'Missing track data'}`);
        console.log("Waiting 10 seconds before retrying this page...");
        await sleep(10000);
        page++;
        continue; 
    }
    
    let tracks = data.recenttracks.track;
    if (!Array.isArray(tracks)) tracks = [tracks];

    tracks.reverse();

    let savedCount = 0;
    let skipCount = 0;

    for (const track of tracks) {
      if (track['@attr']?.nowplaying) continue;

      const timestamp = parseInt(track.date.uts);
      const listenedAt = new Date(timestamp * 1000).toISOString();
      const artistName = track.artist['#text'];
      const albumTitle = track.album['#text'] || 'Unknown Album';
      const songTitle = track.name;

      try {
        const { data: artist, error: artistErr } = await supabase.from('artists')
          .upsert({ name: artistName }, { onConflict: 'name' }).select().single();
        if (artistErr) throw artistErr;

        const { data: album, error: albumErr } = await supabase.from('albums')
          .upsert({ artist_id: artist.id, title: albumTitle, cover_url: track.image[3]['#text'] }, { onConflict: 'artist_id,title' }).select().single();
        if (albumErr) throw albumErr;

        const { data: song, error: songErr } = await supabase.from('songs')
          .upsert({ artist_id: artist.id, album_id: album.id, title: songTitle }, { onConflict: 'artist_id,title' }).select().single();
        if (songErr) throw songErr;

        const { error: scrobbleErr } = await supabase.from('scrobbles')
          .insert({ song_id: song.id, listened_at: listenedAt });

        if (scrobbleErr && scrobbleErr.code === '23505') {
            skipCount++;
        } else if (scrobbleErr) {
            console.error(`Error saving ${songTitle}:`, scrobbleErr);
        } else {
            savedCount++;
        }
      } catch (networkError) {
        console.error(`🌐 Network Error on Page ${page}:`, networkError);
        console.log("Waiting 10 seconds before retrying...");
        await sleep(10000);
        page++; 
    }
    }

    console.log(`✅ Page ${page} complete: ${savedCount} saved, ${skipCount} skipped.`);
    await sleep(1500); 
  }

  console.log(`\n🎉 GRAND BACKFILL COMPLETE! Your entire listening history is now in PostgreSQL.`);
}

runGrandBackfill();