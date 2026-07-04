import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { calculateChartMetrics } from "@/utils/metrics";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

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

  const firstTitle = firstScrobble?.songs ? (firstScrobble.songs as any).title : "None";
  const lastTitle = lastScrobble?.songs ? (lastScrobble.songs as any).title : "None";

  console.log(`Total scrobbles for this week: ${currentScrobbleCount || 0}`);
  console.log("FIRST song of the week:");
  console.log(firstScrobble ? `- ${firstTitle} at ${firstScrobble.listened_at}` : "- None found");
  console.log("LATEST/LAST song of the week:");
  console.log(lastScrobble ? `- ${lastTitle} at ${lastScrobble.listened_at}` : "- None found");
  console.log("--------------------------------\n");

  if (!currentScrobbleCount || currentScrobbleCount === 0) {
    console.log("No scrobbles found for this week. Skipping calculation.");
    return [];
  }

  console.log("Fetching all scrobbles for calculation...");

  const rawScrobbles: any[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error: scrobbleError } = await supabase
      .from("scrobbles")
      .select("song_id, listened_at")
      .gte("listened_at", targetWeek.start_date)
      .lt("listened_at", targetWeek.end_date)
      .order("listened_at", { ascending: true })
      .range(from, from + step - 1);

    if (scrobbleError) {
      console.error("Database error fetching scrobbles:", scrobbleError);
      return null;
    }

    if (!data || data.length === 0) break;
    rawScrobbles.push(...data);

    if (data.length < step) break;
    from += step;
  }

  console.log(`Successfully fetched ${rawScrobbles.length} total scrobbles for the week.`);

  if (!cachedCanonicalMap) {
    console.log("Fetching canonical dictionary...");

    const { data: songPointers } = await supabase
      .from("songs")
      .select("id, canonical_id")
      .not("canonical_id", "is", null);

    cachedCanonicalMap = new Map<string, string>();
    if (songPointers) {
      songPointers.forEach((song) => {
        cachedCanonicalMap!.set(song.id, song.canonical_id);
      });
    }
  }

  const canonicalMap = cachedCanonicalMap;
  const processedMetrics = calculateChartMetrics(rawScrobbles, canonicalMap);

  const stagedEntries = processedMetrics.map((metric) => ({
      week_id: targetWeek.id,
      song_id: metric.songId,
      streams: metric.streams,
      sales: metric.sales,
      airplay: metric.airplay,
      current_week_points: metric.rawPoints,
  }));

  console.log(`Raw points calculated for ${stagedEntries.length} unique songs.`);

  return stagedEntries;
};
