import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const purgeScrobblesFromWeek = async (startDateStr: string) => {
  console.log(`\nInitiating rollback from: ${startDateStr}`);

  const { data: targetWeek, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("start_date")
    .eq("start_date", startDateStr)
    .single();

  if (weekErr || !targetWeek) {
    console.error(
      "ERROR: Could not find a chart week matching that start date.",
    );
    return;
  }

  const { error: deleteError, count: deletedCount } = await supabase
    .from("scrobbles")
    .delete({ count: "exact" })
    .gte("listened_at", targetWeek.start_date);

  if (deleteError) {
    console.error("Database error during scrobble purge:", deleteError);
  } else {
    console.log(`SUCCESS: Permanently deleted ${deletedCount || 0} scrobbles.`);
  }
};

export const purgeChartEntriesFromWeek = async (startDateStr: string) => {
  console.log(`\nInitiating Chart Entry Purge from: ${startDateStr}`);

  const { data: targetWeeks, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .gte("start_date", startDateStr);

  if (weekErr || !targetWeeks || targetWeeks.length === 0) {
    console.error(
      "ERROR: Could not find any chart weeks starting on or after that date.",
    );
    return;
  }

  const weekIds = targetWeeks.map((w) => w.id);

  console.log(`Found ${weekIds.length} weeks to purge.`);

  const { error: deleteError, count: deletedCount } = await supabase
    .from("chart_entries")
    .delete({ count: "exact" })
    .in("week_id", weekIds);

  if (deleteError) {
    console.error("Database error during chart entry purge:", deleteError);
  } else {
    console.log(
      `SUCCESS: Permanently deleted ${deletedCount || 0} chart entries across ${weekIds.length} weeks.`,
    );
  }
};

const targetDate = "2026-06-04T22:00:00+00:00";
purgeScrobblesFromWeek(targetDate);
purgeChartEntriesFromWeek(targetDate);
