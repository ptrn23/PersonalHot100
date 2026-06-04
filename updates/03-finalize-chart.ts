import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const finalizeChartPositions = async (stagedEntries: any[], overrideTargetDate?: string) => {
  console.log("\nRunning finalize chart positions...");

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
    return;
  }

  console.log(`Target Week: ${targetWeek.start_date} to ${targetWeek.end_date}`);
  console.log("Cleaning up existing chart entries for the target week...");
  
  const { error: deleteError, count: deletedCount } = await supabase
    .from("chart_entries")
    .delete({ count: "exact" })
    .eq("week_id", targetWeek.id);

  if (deleteError) {
    console.error("Database error during cleanup:", deleteError);
    return;
  }

  console.log(`Cleanup complete: Removed ${deletedCount || 0} existing entries for this week.\n`);

  // TODO: MOMENTUM AND CALCULATION LOGIC WILL GO HERE

};

finalizeChartPositions([]);