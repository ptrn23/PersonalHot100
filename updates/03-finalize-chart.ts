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
  console.log("Fetching historical weeks for momentum calculation...");

  const { data: previousWeeks } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .lt("start_date", targetWeek.start_date)
    .order("start_date", { ascending: false })
    .limit(2);

  const lastWeek = previousWeeks?.[0] || null;
  const twoWeeksAgo = previousWeeks?.[1] || null;

  let lastWeekChart: Record<string, any> = {};
  if (lastWeek) {
    const { data } = await supabase
      .from("chart_entries")
      .select("song_id, total_points, rank")
      .eq("week_id", lastWeek.id);
      
    lastWeekChart = data?.reduce((acc, row) => ({ ...acc, [row.song_id]: row }), {}) || {};
    console.log(`Found ${data?.length || 0} entries from last week.`);
  }

  let twoWeeksAgoChart: Record<string, any> = {};
  if (twoWeeksAgo) {
    const { data } = await supabase
      .from("chart_entries")
      .select("song_id, total_points")
      .eq("week_id", twoWeeksAgo.id);
      
    twoWeeksAgoChart = data?.reduce((acc, row) => ({ ...acc, [row.song_id]: row }), {}) || {};
    console.log(`Found ${data?.length || 0} entries from two weeks ago.\n`);
  }

  console.log("Applying decay multipliers and sorting Top 100...");

  const currentWeekStats = stagedEntries.reduce((acc, row) => ({ ...acc, [row.song_id]: row }), {});
  const allContenders = new Set([
    ...stagedEntries.map((e) => e.song_id),
    ...Object.keys(lastWeekChart),
    ...Object.keys(twoWeeksAgoChart),
  ]);

  const chartContenders = [];

  for (const songId of allContenders) {
    const currentStats = currentWeekStats[songId] || {
      streams: 0,
      sales: 0,
      airplay: 0,
      current_week_points: 0,
    };

    const prevPoints = lastWeekChart[songId]?.total_points || 0;
    const twoWeeksPoints = twoWeeksAgoChart[songId]?.total_points || 0;
    
    const rawPoints = currentStats.current_week_points;
    const finalWeightedPoints = Math.floor(
      rawPoints + Math.floor(prevPoints * 0.3) + Math.floor(twoWeeksPoints * 0.2)
    );

    if (finalWeightedPoints === 0) continue;

    chartContenders.push({
      song_id: songId,
      streams: currentStats.streams,
      sales: currentStats.sales,
      airplay: currentStats.airplay,
      current_week_points: rawPoints,
      previous_week_raw_points: prevPoints,
      two_weeks_ago_raw_points: twoWeeksPoints,
      total_points: finalWeightedPoints,
    });
  }

  chartContenders.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.current_week_points !== a.current_week_points) return b.current_week_points - a.current_week_points;
    return b.streams - a.streams;
  });
  
  const top100 = chartContenders.slice(0, 100);
  
  console.log(`Calculated points for ${chartContenders.length} total contenders.`);
  if (top100.length > 0) {
    console.log(`Sliced Top 100! (Rank 1 has ${top100[0].total_points} pts, Rank ${top100.length} has ${top100[top100.length - 1].total_points} pts)\n`);
  } else {
    console.log("No songs scored any points this week.\n");
  }
};

finalizeChartPositions([]);