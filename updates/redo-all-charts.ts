import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
import { calculateWeeklyPoints } from "./02-calculate-points";
import { finalizeChartPositions } from "./03-finalize-chart";

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

  console.log(`Found ${allWeeks.length} total weeks to rebuild.`);

  console.log("Wiping 'chart_entries' table...");
  const { error: clearErr } = await supabase
    .from("chart_entries")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (clearErr) {
    console.error("ERROR clearing chart entries:", clearErr.message);
    return;
  }
  console.log("'chart_entries' table is clear.\n");

  for (let i = 0; i < allWeeks.length; i++) {
    const week = allWeeks[i];
    
    const targetDateStr = week.end_date.split('T')[0];
    console.log(`Processing week [${i + 1}/${allWeeks.length}] | Target Date: ${targetDateStr}`);

    const stagedEntries = await calculateWeeklyPoints(targetDateStr);
    if (!stagedEntries || stagedEntries.length === 0) {
      console.log(`No entries calculated for ${targetDateStr}. Skipping finalization.`);
      continue;
    }

    await finalizeChartPositions(stagedEntries, targetDateStr);
  }

  console.log("\nRedo all charts complete.");
}

runRedoAllCharts();