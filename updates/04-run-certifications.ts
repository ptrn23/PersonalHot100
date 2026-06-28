import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const CERT_THRESHOLDS = {
  song: {
    Gold: 500_000,
    Platinum: 1_000_000,
    Diamond: 10_000_000,
  },
  album: {
    Gold: 1_000_000,
    Platinum: 5_000_000,
    Diamond: 50_000_000,
  },
};

export const runCertifications = async (overrideTargetDate?: string) => {
  console.log("\nRunning certification engine...");

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
    console.error("ERROR: No chart weeks found for certifications.");
    return;
  }

  console.log(`Checking certifications for week of ${targetWeek.start_date}`);

  const { data: weekEntries, error: entriesError } = await supabase
    .from("chart_entries")
    .select(`
      song_id,
      songs ( album_id )
    `)
    .eq("week_id", targetWeek.id);

  if (entriesError || !weekEntries || weekEntries.length === 0) {
    console.log("No chart entries found this week to certify.");
    return;
  }

  const songIds = Array.from(new Set(weekEntries.map((e) => e.song_id)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumIds = Array.from(new Set(weekEntries.map((e) => (e.songs as any)?.album_id).filter(Boolean)));

  console.log(`Found ${songIds.length} unique songs and ${albumIds.length} unique albums to evaluate.`);
  
  const { data: albumSongsData, error: albumSongsError } = await supabase
    .from("songs")
    .select("id, album_id")
    .in("album_id", albumIds);

  if (albumSongsError) {
    console.error("Error fetching album songs:", albumSongsError);
    return;
  }

  const albumSongsMap = new Map<string, string>();
  albumSongsData?.forEach((s) => {
    if (s.album_id) albumSongsMap.set(s.id, s.album_id);
  });

  const allRelevantSongIds = Array.from(
    new Set([...songIds, ...(albumSongsData?.map((s) => s.id) || [])])
  );

  console.log(`Fetching historical points for ${allRelevantSongIds.length} tracks...`);

  const historicalEntries: any[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("chart_entries")
      .select(`
        song_id, 
        total_points, 
        chart_weeks!inner(end_date)
      `)
      .in("song_id", allRelevantSongIds)
      .lte("chart_weeks.end_date", targetWeek.end_date)
      .range(from, from + step - 1);

    if (error) {
      console.error("Database error fetching historical points:", error);
      return;
    }

    if (!data || data.length === 0) break;
    historicalEntries.push(...data);

    if (data.length < step) break;
    from += step;
  }

  const songTotals = new Map<string, number>();
  const albumTotals = new Map<string, number>();

  for (const entry of historicalEntries) {
    const sId = entry.song_id;
    const points = entry.total_points || 0;

    songTotals.set(sId, (songTotals.get(sId) || 0) + points);
    
    const aId = albumSongsMap.get(sId);
    if (aId) {
      albumTotals.set(aId, (albumTotals.get(aId) || 0) + points);
    }
  }

  console.log("Points tallied successfully!");
};