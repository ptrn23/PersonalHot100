import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export type NewsItem = {
  week_id: string;
  event_type: string;
  entity_type: "song" | "album" | "artist";
  entity_id: string;
  headline: string;
  subtext?: string;
  priority: number;
};

const detectNumberOnes = async (currentChart: any[], weekId: string): Promise<NewsItem[]> => {
  const news: NewsItem[] = [];
  
  const numberOne = currentChart.find((entry) => entry.rank === 1);
  if (!numberOne) return news;

  const songTitle = numberOne.songs.display_title || numberOne.songs.title || "Unknown Title";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (numberOne.songs.artists as any)?.name || "Unknown Artist";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistId = (numberOne.songs.artists as any)?.id;

  if (numberOne.peak_position === 1 && numberOne.peak_streak === 1) {
    const { data: artistSongs } = await supabase
      .from("songs")
      .select("id")
      .eq("artist_id", artistId);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any  
    const songIds = artistSongs?.map((s) => s.id) || [];

    let uniqueNumberOnesCount = 1;
    
    if (songIds.length > 0) {
      const { data: pastHits } = await supabase
        .from("chart_entries")
        .select("song_id")
        .eq("peak_position", 1)
        .in("song_id", songIds);
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uniqueNumberOnesCount = new Set(pastHits?.map((e) => e.song_id)).size;
    }

    const j = uniqueNumberOnesCount % 10;
    const k = uniqueNumberOnesCount % 100;
    let suffix = "th";
    if (j === 1 && k !== 11) suffix = "st";
    else if (j === 2 && k !== 12) suffix = "nd";
    else if (j === 3 && k !== 13) suffix = "rd";

    news.push({
      week_id: weekId,
      event_type: "NEW_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: `“${songTitle}” by ${artistName} reaches #1 on the Personal Hot 100 for the first time.`,
      subtext: uniqueNumberOnesCount > 1 
        ? `This marks ${artistName}'s ${uniqueNumberOnesCount}${suffix} career #1 hit on the chart.`
        : `This is ${artistName}'s first ever #1 hit!`,
      priority: 10,
    });
  } 
  
  else if (numberOne.previous_position === 1) {
    news.push({
      week_id: weekId,
      event_type: "HOLD_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: `“${songTitle}” spends a ${numberOne.peak_streak}th week at #1 in the Personal Hot 100.`,
      priority: 9,
    });
  } 
  
  else if (numberOne.peak_position === 1 && numberOne.previous_position !== 1) {
    news.push({
      week_id: weekId,
      event_type: "RETURN_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: `“${songTitle}” by ${artistName} returns to #1 on the Personal Hot 100!`,
      subtext: `The track reclaims the top spot for a ${numberOne.peak_streak}th nonconsecutive week.`,
      priority: 9,
    });
  }

  return news;
};

export const generateNews = async (isFinalizing?: boolean, overrideTargetDate?: string) => {
  if (!isFinalizing) return;
  console.log("\nRunning news engine...");

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
    console.error("No valid chart week found for news generation.");
    return;
  }

  const { data: currentChart, error: chartError } = await supabase
    .from("chart_entries")
    .select(`
      *,
      songs ( id, display_title, title, album_id, artists(id, name) )
    `)
    .eq("week_id", targetWeek.id)
    .order("rank", { ascending: true });

  if (chartError || !currentChart || currentChart.length === 0) {
    console.log("No chart entries found to analyze this week.");
    return;
  }

  const newsItems: NewsItem[] = [];

  console.log("Analyzing chart movements...");
  
  const numberOneNews = await detectNumberOnes(currentChart, targetWeek.id);
  newsItems.push(...numberOneNews);

  if (newsItems.length > 0) {
    console.log(`Writing ${newsItems.length} headline(s) to the news feed...`);
    const { error: insertError } = await supabase
      .from("news_feed")
      .insert(newsItems);
      
    if (insertError) {
      console.error("Error saving news:", insertError);
    } else {
      console.log("News feed updated successfully!");
    }
  } else {
    console.log("No major news generated this week.");
  }
};