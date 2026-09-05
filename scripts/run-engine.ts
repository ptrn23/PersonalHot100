import { fetchAndMergeScrobbles } from "./01-fetch-scrobbles";
import { calculateWeeklyPoints } from "./02-calculate-points";
import { finalizeChartPositions } from "./03-finalize-chart";
import { runCertifications } from "./04-run-certifications";
import { generateNews } from "./05-generate-news";
import { syncSpotifyIds } from "./06-sync-spotify";
import { setupNextChartWeek } from "./calendar";

import { supabase } from "../utils/supabase";
import { createClient } from "@supabase/supabase-js";

async function runEngine() {
  console.log("\nStarting Hot 100 Engine...");
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const overrideDate = process.argv[2];

  if (overrideDate) {
    console.log(`Manual Date Override detected: ${overrideDate}`);
  }

  const fetchResult = await fetchAndMergeScrobbles(overrideDate);
  if (!fetchResult || fetchResult.status === "error") {
    console.error("Engine halted due to Step 1 error.");
    return;
  }

  const syncMode = fetchResult.isFinalizing ? "WEEK DONE" : "WEEK IN PROGRESS";
  console.log(`\nExecution Mode: ${syncMode}. Proceeding to chart calculations...`);

  const stagedEntries = await calculateWeeklyPoints(overrideDate);
  if (!stagedEntries || stagedEntries.length === 0) {
    console.warn("No points generated in Step 2. Halting engine.");
    return;
  }
  
  await syncSpotifyIds(supabaseAdmin, stagedEntries);

  await finalizeChartPositions(stagedEntries, fetchResult.isFinalizing, overrideDate);
  await runCertifications(fetchResult.isFinalizing, overrideDate);
  await generateNews(fetchResult.isFinalizing, overrideDate);

  const { data: currentWeek } = await supabase
    .from("chart_weeks")
    .select("end_date")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (currentWeek && fetchResult.isFinalizing) {
    await setupNextChartWeek(supabaseAdmin, currentWeek.end_date, fetchResult.isFinalizing);
  } else {
    console.error("Could not find an active chart week to base the calendar on.");
  }

  console.log(`\nCOMPLETE! The chart is live.`);
}

runEngine();
