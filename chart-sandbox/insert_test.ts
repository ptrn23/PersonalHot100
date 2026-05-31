import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

class TimeManager {
  static getChartWeek(utcUnixSeconds: number) {
    const localTimestamp = utcUnixSeconds + (8 * 3600);
    const date = new Date(localTimestamp * 1000); 

    const dayOfWeek = date.getUTCDay(); 
    const hours = date.getUTCHours();
    
    let daysSinceFriday = dayOfWeek - 5;
    if (daysSinceFriday < 0 || (daysSinceFriday === 0 && hours < 6)) {
      daysSinceFriday += 7;
    }

    const startDate = new Date(date);
    startDate.setUTCDate(date.getUTCDate() - daysSinceFriday);
    startDate.setUTCHours(6, 0, 0, 0); 

    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 7); 

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
}

async function runTestInsertion() {
  console.log("Fetching latest 200 tracks from Last.fm...\n");
  
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=200`;
  const response = await fetch(url);
  const data = await response.json();
  const tracks = data.recenttracks.track.reverse();

  let successCount = 0;
  let duplicateCount = 0;

  console.log(`Starting Database Insertion for ${tracks.length} tracks...\n`);

  for (const track of tracks) {
    if (track['@attr']?.nowplaying) continue;

    const timestamp = parseInt(track.date.uts);
    const listenedAt = new Date(timestamp * 1000).toISOString();
    
    const weekBounds = TimeManager.getChartWeek(timestamp);
    const { data: week, error: weekErr } = await supabase.from('chart_weeks')
      .upsert({ start_date: weekBounds.startDate, end_date: weekBounds.endDate }, { onConflict: 'end_date' })
      .select().single();
    if (weekErr) throw weekErr;

    const { data: artist, error: artistErr } = await supabase.from('artists')
      .upsert({ name: track.artist['#text'] }, { onConflict: 'name' })
      .select().single();
    if (artistErr) throw artistErr;

    const { data: album, error: albumErr } = await supabase.from('albums')
      .upsert({ 
        artist_id: artist.id, 
        title: track.album['#text'], 
        cover_url: track.image[3]['#text'] 
      }, { onConflict: 'artist_id,title' })
      .select().single();
    if (albumErr) throw albumErr;

    const { data: song, error: songErr } = await supabase.from('songs')
      .upsert({ 
        artist_id: artist.id, 
        album_id: album.id, 
        title: track.name 
      }, { onConflict: 'artist_id,title' })
      .select().single();
    if (songErr) throw songErr;

    const { error: scrobbleErr } = await supabase.from('scrobbles')
      .insert({ song_id: song.id, listened_at: listenedAt });

    if (scrobbleErr && scrobbleErr.code === '23505') {
        duplicateCount++;
    } else if (scrobbleErr) {
        console.error("Scrobble Error:", scrobbleErr);
    } else {
        successCount++;
        console.log(`✅ Saved: ${track.name} by ${track.artist['#text']} (Week: ${weekBounds.startDate})`);
    }
  }

  console.log(`\n🎉 DONE! Successfully inserted ${successCount} new scrobbles.`);
  if (duplicateCount > 0) console.log(`⏩ Skipped ${duplicateCount} duplicates (already in database).`);
}

runTestInsertion();