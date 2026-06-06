import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

let cachedCanonicalMap: Map<string, string> | null = null;

export const calculateWeeklyPoints = async (overrideTargetDate?: string) => {
  console.log("\nRunning calculate points...");

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
    return null;
  }

  console.log("\nTARGET WEEK:");
  console.log(targetWeek);
  console.log("--------------------------------");

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

  const firstTitle = firstScrobble?.songs
    ? (firstScrobble.songs as any).title
    : "None";
  const lastTitle = lastScrobble?.songs
    ? (lastScrobble.songs as any).title
    : "None";

  console.log(`Total scrobbles for this week: ${currentScrobbleCount || 0}`);
  console.log("FIRST song of the week:");
  console.log(
    firstScrobble
      ? `- ${firstTitle} at ${firstScrobble.listened_at}`
      : "- None found",
  );
  console.log("LATEST/LAST song of the week:");
  console.log(
    lastScrobble
      ? `- ${lastTitle} at ${lastScrobble.listened_at}`
      : "- None found",
  );
  console.log("--------------------------------\n");

  if (!currentScrobbleCount || currentScrobbleCount === 0) {
    console.log("No scrobbles found for this week. Skipping calculation.");
    return [];
  }

  console.log("Fetching all scrobbles for calculation...");
  const { data: rawScrobbles, error: scrobbleError } = await supabase
    .from("scrobbles")
    .select("song_id, listened_at")
    .gte("listened_at", targetWeek.start_date)
    .lt("listened_at", targetWeek.end_date)
    .order("listened_at", { ascending: true });

  if (scrobbleError || !rawScrobbles) {
    console.error("Database error fetching scrobbles:", scrobbleError);
    return null;
  }

  if (!cachedCanonicalMap) {
    console.log("Fetching canonical dictionary...");
    const { data: songPointers } = await supabase
      .from("songs")
      .select("id, canonical_id")
      .limit(10000);

    cachedCanonicalMap = new Map<string, string>();
    if (songPointers) {
      songPointers.forEach((song) => {
        if (song.canonical_id) {
          cachedCanonicalMap!.set(song.id, song.canonical_id);
        }
      });
    }
  }

  const canonicalMap = cachedCanonicalMap;

  const weeklyStats = new Map<
    string,
    { streams: number; sales: number; airplay: number; currentStreak: number }
  >();

  let previousCanonicalSongId: string | null = null;

  for (const scrobble of rawScrobbles) {
    const rawSongId = scrobble.song_id;
    const songId = canonicalMap.get(rawSongId) || rawSongId;

    if (!weeklyStats.has(songId)) {
      weeklyStats.set(songId, {
        streams: 0,
        sales: 0,
        airplay: 0,
        currentStreak: 0,
      });
    }

    const stats = weeklyStats.get(songId)!;

    stats.streams += 1;

    if (previousCanonicalSongId !== songId) {
      stats.sales += 1;
      if (previousCanonicalSongId && weeklyStats.has(previousCanonicalSongId)) {
        weeklyStats.get(previousCanonicalSongId)!.currentStreak = 0;
      }
    }

    stats.currentStreak += 1;
    stats.airplay = Math.max(stats.airplay, stats.currentStreak);

    previousCanonicalSongId = songId;
  }

  const stagedEntries: any[] = [];

  for (const [songId, stats] of weeklyStats.entries()) {
    const rawPoints =
      Math.floor(stats.streams * 5) +
      Math.floor(stats.sales * 3) +
      Math.floor(stats.airplay * 2);

    stagedEntries.push({
      week_id: targetWeek.id,
      song_id: songId,
      streams: stats.streams,
      sales: stats.sales,
      airplay: stats.airplay,
      current_week_points: rawPoints,
    });
  }

  console.log(
    `Raw points calculated for ${stagedEntries.length} unique songs.`,
  );

  return stagedEntries;
};
