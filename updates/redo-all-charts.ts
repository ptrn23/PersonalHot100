import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

async function runRedoAllCharts() {
  console.log("\nRunning redo all charts...");

  const { data: allWeeks, error: weeksErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: true });

  if (weeksErr || !allWeeks || allWeeks.length === 0) {
    console.error("ERROR: No chart weeks found in the database.");
    return;
  }

  console.log(`Found ${allWeeks.length} total tracking weeks to process.\n`);

  for (let i = 0; i < allWeeks.length; i++) {
    const week = allWeeks[i];
    const startDate = week.start_date.split('T')[0];
    const endDate = week.end_date.split('T')[0];

    console.log(`[Week ${i + 1}/${allWeeks.length}] | ${startDate} to ${endDate}`);

    const { count: scrobbleCount, error: countErr } = await supabase
      .from("scrobbles")
      .select("*", { count: "exact", head: true })
      .gte("listened_at", week.start_date)
      .lt("listened_at", week.end_date);

    if (countErr) {
      console.error(`Error fetching count: ${countErr.message}`);
      continue;
    }

    console.log(`Total Scrobbles: ${scrobbleCount || 0}`);
  }

  console.log("\nDONE!");
}

runRedoAllCharts();