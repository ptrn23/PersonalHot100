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

  console.log("FIRST song of the week currently in DB:");
  console.log(firstScrobble ? `- ${firstTitle} at ${firstScrobble.listened_at}` : "- None found");

  console.log("LATEST/LAST song of the week currently in DB:");
  console.log(lastScrobble ? `- ${lastTitle} at ${lastScrobble.listened_at}` : "- None found");
  console.log("--------------------------------\n");
};

fetchAndMergeScrobbles();