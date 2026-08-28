import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateNews } from "./05-generate-news";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const rollbackNews = async (startCutoff: string) => {
  console.log("Clearing entire news feed table...");

  const { error: deleteError } = await supabase.from("news_feed").delete().not("id", "is", null);

  if (deleteError) {
    console.error("Failed to clear news_feed:", deleteError);
    return;
  }
  console.log("News feed table completely cleared!");

  console.log(`\nFetching chronological chart weeks starting from ${startCutoff}...`);
  const { data: weeks, error: weeksError } = await supabase
    .from("chart_weeks")
    .select("end_date")
    .gte("end_date", startCutoff)
    .order("end_date", { ascending: true });

  if (weeksError || !weeks || weeks.length === 0) {
    console.error("Failed to fetch chart weeks or no weeks found:", weeksError);
    return;
  }

  console.log(`Found ${weeks.length} weeks to process. Starting historical news generation...\n`);

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const overrideDate = week.end_date.split("T")[0].split(" ")[0];

    console.log(`[${i + 1}/${weeks.length}] Processing week ending on: ${overrideDate}`);
    await generateNews(true, overrideDate);
  }

  console.log("\nSUCCESS: The historical news feed timeline has been completely rebuilt!");
};

const START_TIMESTAMP = "2020-04-30 22:00:00+00";

rollbackNews(START_TIMESTAMP);
