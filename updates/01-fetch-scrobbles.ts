import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3, delayMs = 3000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Network hiccup. Retrying in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }
  }
  throw new Error("Fetch failed completely.");
}

export const fetchAndMergeScrobbles = async (overrideTargetDate?: string) => {
  console.log("\nRunning fetch scrobbles...");

  const now = new Date();
  console.log(`Time now is: ${now.toISOString()} (Server UTC)`);

  let targetWeek;

  if (overrideTargetDate) {
    const exactCutoff = `${overrideTargetDate} 22:00:00+00`; 
    const { data } = await supabase
      .from("chart_weeks")
      .select("*")
      .lte("end_date", exactCutoff)
      .order("end_date", { ascending: false })
      .limit(1)
      .single();
    targetWeek = data;
  } else {
    const { data } = await supabase
      .from("chart_weeks")
      .select("*")
      .order("end_date", { ascending: false })
      .limit(1)
      .single();
    targetWeek = data;
  }

  if (!targetWeek) {
    console.error("ERROR: No chart weeks found in the database.");
    return { status: "error" };
  }

  console.log("\nTARGET WEEK:");
  console.log(targetWeek);
  console.log("--------------------------------\n");

  const dbEndDate = new Date(targetWeek.end_date);
  const dbStartDate = new Date(targetWeek.start_date);
  
  let fetchEndDate = now;
  let isFinalizing = false;

  if (now >= dbEndDate || overrideTargetDate) {
    fetchEndDate = dbEndDate; 
    isFinalizing = true;
    console.log(`Code is doing Fetch B (Finalizing completed week: ${targetWeek.start_date} to ${targetWeek.end_date})`);
  } else {
    console.log(`Code is doing Fetch A (Mid-week sync up to current time)`);
  }

  const { count: currentScrobbleCount } = await supabase
    .from("scrobbles")
    .select("*", { count: "exact", head: true })
    .gte("listened_at", targetWeek.start_date)
    .lt("listened_at", targetWeek.end_date);

  const { data: firstScrobble } = await supabase
    .from("scrobbles")
    .select("listened_at, songs(title)")
    .gte("listened_at", targetWeek.start_date)
    .lt("listened_at", targetWeek.end_date)
    .order("listened_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: lastScrobble } = await supabase
    .from("scrobbles")
    .select("listened_at, songs(title)")
    .gte("listened_at", targetWeek.start_date)
    .lt("listened_at", targetWeek.end_date)
    .order("listened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const firstTitle = firstScrobble?.songs ? (firstScrobble.songs as any).title : "None";
  const lastTitle = lastScrobble?.songs ? (lastScrobble.songs as any).title : "None";

  console.log(`Total scrobbles currently in DB for this week: ${currentScrobbleCount || 0}`);
  console.log("FIRST song of the week currently in DB:");
  console.log(firstScrobble ? `- ${firstTitle} at ${firstScrobble.listened_at}` : "- None found");
  console.log("LATEST/LAST song of the week currently in DB:");
  console.log(lastScrobble ? `- ${lastTitle} at ${lastScrobble.listened_at}` : "- None found");
  console.log("--------------------------------\n");

  let fromUnix = Math.floor(dbStartDate.getTime() / 1000);
  const toUnix = Math.floor(fetchEndDate.getTime() / 1000);

  if (lastScrobble && lastScrobble.listened_at) {
    const lastScrobbleDate = new Date(lastScrobble.listened_at);
    fromUnix = Math.floor(lastScrobbleDate.getTime() / 1000) + 1;
    console.log(`Resuming Last.fm fetch from ${lastScrobbleDate.toISOString()}`);
  }

  let page = 1;
  let totalPages = 1;
  let savedCount = 0;
  let skipCount = 0;

  do {
    console.log(`Fetching Page ${page} of ${totalPages}...`);
    
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=200&from=${fromUnix}&to=${toUnix}&page=${page}`;
    
    const response = await fetchWithRetry(url, 3, 5000);
    const data = await response.json();

    if (data.error || !data.recenttracks) {
      console.error(`Last.fm API Glitch: ${data.message || "Missing track data"}`);
      console.log("Waiting 5 seconds before retrying this page...");
      await sleep(5000);
      continue; 
    }

    totalPages = parseInt(data.recenttracks["@attr"].totalPages) || 1;
    let tracks = data.recenttracks.track;
    
    if (!tracks) break; 
    if (!Array.isArray(tracks)) tracks = [tracks];

    tracks.reverse();

    for (const track of tracks) {
      if (track["@attr"]?.nowplaying) continue;

      const timestamp = parseInt(track.date.uts);
      const listenedAt = new Date(timestamp * 1000).toISOString();
      const artistName = track.artist["#text"];
      const albumTitle = track.album["#text"] || "Unknown Album";
      const songTitle = track.name;
      const coverUrl = track.image?.[3]?.["#text"] || "";

      try {
        const { data: artist, error: artistErr } = await supabase
          .from("artists")
          .upsert({ name: artistName }, { onConflict: "name" })
          .select("id")
          .single();
        if (artistErr) throw artistErr;

        const { data: album, error: albumErr } = await supabase
          .from("albums")
          .upsert(
            { artist_id: artist.id, title: albumTitle, cover_url: coverUrl },
            { onConflict: "artist_id,title" }
          )
          .select("id")
          .single();
        if (albumErr) throw albumErr;

        const { data: song, error: songErr } = await supabase
          .from("songs")
          .upsert(
            { artist_id: artist.id, album_id: album.id, title: songTitle },
            { onConflict: "artist_id,title" }
          )
          .select("id")
          .single();
        if (songErr) throw songErr;

        const { error: scrobbleErr } = await supabase
          .from("scrobbles")
          .insert({ song_id: song.id, listened_at: listenedAt });

        if (scrobbleErr && scrobbleErr.code === "23505") {
          skipCount++;
        } else if (scrobbleErr) {
          console.error(`Error saving ${songTitle}:`, scrobbleErr);
        } else {
          savedCount++;
        }
      } catch (dbError) {
        console.error(`Database Error on track ${songTitle}:`, dbError);
      }
    }

    page++;
    await sleep(500); 

  } while (page <= totalPages);

  console.log(`\nScrobbles merged and entities upserted.`);
  console.log(`Summary: ${savedCount} new scrobbles saved, ${skipCount} duplicates skipped.`);

  if (isFinalizing) {
    console.log("\nChecking next charting week...");
    
    const nextStartDate = new Date(dbEndDate);
    const nextEndDate = new Date(dbEndDate);
    nextEndDate.setDate(nextEndDate.getDate() + 7);
    const nextStartStr = nextStartDate.toISOString();
    const nextEndStr = nextEndDate.toISOString();

    const { data: existingNextWeek } = await supabase
      .from("chart_weeks")
      .select("id")
      .eq("end_date", nextEndStr)
      .maybeSingle();

    if (!existingNextWeek) {
      console.log(`Creating new charting week in database...`);
      const { data: newWeek, error: newWeekErr } = await supabase
        .from("chart_weeks")
        .insert({ start_date: nextStartStr, end_date: nextEndStr })
        .select()
        .single();

      if (newWeekErr) {
        console.error(`Failed to create next week:`, newWeekErr);
      } else {
        console.log(`SUCCESS: Created next charting week (${newWeek.start_date} to ${newWeek.end_date})`);
      }
    } else {
      console.log(`Next charting week already exists. Skipping creation.`);
    }
  }

  return { status: "success", isFinalizing, weekId: targetWeek.id };
};

fetchAndMergeScrobbles();