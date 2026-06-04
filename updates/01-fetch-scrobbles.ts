import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

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
};

fetchAndMergeScrobbles();