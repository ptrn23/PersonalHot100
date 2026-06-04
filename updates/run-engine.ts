import { fetchAndMergeScrobbles } from "./01-fetch-scrobbles";
import { calculateWeeklyPoints } from "./02-calculate-points";
import { finalizeChartPositions } from "./03-finalize-chart";

async function runEngine() {
  console.log("\nStarting Hot 100 Engine...");

  const overrideDate = process.argv[2];

  if (overrideDate) {
    console.log(`Manual Date Override detected: ${overrideDate}`);
  }

  const fetchResult = await fetchAndMergeScrobbles(overrideDate);
  if (!fetchResult || fetchResult.status === "error") {
    console.error("Engine halted due to Step 1 error.");
    return;
  }

  if (fetchResult.isFinalizing) {
    console.log("\nWeek is finalized! Proceeding to chart calculations...");

    const stagedEntries = await calculateWeeklyPoints(overrideDate);
    if (!stagedEntries || stagedEntries.length === 0) {
      console.warn("No points generated in Step 2. Halting engine.");
      return;
    }

    await finalizeChartPositions(stagedEntries, overrideDate);

    console.log("\nCOMPLETE! The chart is live.");
  } else {
    console.log("\nMid-week sync complete. Halting engine until week ends.");
  }
}

runEngine();
