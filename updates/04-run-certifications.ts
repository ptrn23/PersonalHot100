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
  
};