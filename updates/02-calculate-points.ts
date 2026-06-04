import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

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
};

calculateWeeklyPoints();