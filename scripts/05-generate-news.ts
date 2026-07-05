import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CHART_NAME } from "@/config/constants";
import { NewsItem } from "@/types";
import { formatOrdinal } from "@/utils/formatters";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const detectNumberOnes = async (currentChart: any[], weekId: string): Promise<NewsItem[]> => {
  const news: NewsItem[] = [];

  const numberOne = currentChart.find((entry) => entry.rank === 1);
  if (!numberOne) return news;

  const songTitle = numberOne.songs.display_title || numberOne.songs.title || "Unknown Title";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (numberOne.songs.artists as any)?.name || "Unknown Artist";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistId = (numberOne.songs.artists as any)?.id;

  const subtextFormat = `Personal Hot 100: #1(${
    numberOne.previous_position ? (numberOne.previous_position === 1 ? "=" : `+${numberOne.previous_position - 1}`) : "new"
  }) ${songTitle}, ${artistName} [${numberOne.weeks_on_chart} weeks].`;

  if (numberOne.peak_position === 1 && numberOne.peak_streak === 1) {
    const { data: artistSongs } = await supabase.from("songs").select("id").eq("artist_id", artistId);
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

    const isDebut = numberOne.weeks_on_chart === 1;
    const headline = isDebut
      ? `“${songTitle}” by ${artistName} debuts at #1 in Personal Hot 100.`
      : `“${songTitle}” by ${artistName} reaches #1 on the ${CHART_NAME} Hot 100 for the first time.`;

    news.push({
      week_id: weekId,
      event_type: isDebut ? "DEBUT_NUMBER_ONE" : "NEW_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: headline,
      subtext: `${subtextFormat} *new peak*`,
      priority: 10,
    });
  } else if (numberOne.previous_position === 1) {
    news.push({
      week_id: weekId,
      event_type: "HOLD_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: `“${songTitle}” by ${artistName} spends its ${formatOrdinal(
        numberOne.peak_streak,
      )} week at #1 on the ${CHART_NAME} Hot 100.`,
      subtext: `${subtextFormat} *peak: #1*`,
      priority: 9,
    });
  } else if (numberOne.peak_position === 1 && numberOne.previous_position !== 1) {
    news.push({
      week_id: weekId,
      event_type: "RETURN_NUMBER_ONE",
      entity_type: "song",
      entity_id: numberOne.song_id,
      headline: `“${songTitle}” by ${artistName} returns to #1 on the ${CHART_NAME} Hot 100!`,
      subtext: `${subtextFormat} *peak: #1*`,
      priority: 9,
    });
  }

  return news;
};

const detectCertifications = async (weekId: string): Promise<NewsItem[]> => {
  const news: NewsItem[] = [];

  const { data: certs, error } = await supabase
    .from("certifications")
    .select(`
      *,
      songs (id, title, display_title, artists(name)),
      albums (id, title, artists(name))
    `)
    .eq("week_id", weekId);

  if (error || !certs) return news;

  certs.forEach((cert) => {
    let title = "";
    let artist = "";
    const isSong = cert.entity_type === "song";

    if (isSong && cert.songs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title = (cert.songs as any).display_title || (cert.songs as any).title;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      artist = (cert.songs as any).artists?.name;
    } else if (!isSong && cert.albums) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title = (cert.albums as any).title;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      artist = (cert.albums as any).artists?.name;
    }

    if (!title || !artist) return;

    const awardString = cert.multiplier > 1 ? `${cert.multiplier}x ${cert.award_name}` : cert.award_name;
    
    let baseValue = 0;
    if (cert.award_name === "Diamond") baseValue = 10000000;
    if (cert.award_name === "Platinum") baseValue = 1000000;
    if (cert.award_name === "Gold") baseValue = 500000;
    
    const totalRequired = baseValue * cert.multiplier;
    const formattedUnits = totalRequired.toLocaleString("en-US");

    news.push({
      week_id: weekId,
      event_type: "CERTIFICATION",
      entity_type: cert.entity_type,
      entity_id: isSong ? cert.song_id : cert.album_id,
      headline: `${artist}'s "${title}" is now certified ${awardString} in Personal Charts.`,
      subtext: `Awarded for selling over ${formattedUnits} units worldwide.`,
      priority: cert.award_name === "Diamond" ? 9 : cert.award_name === "Platinum" ? 7 : 5,
    });
  });

  return news;
};

const detectMovements = (currentChart: any[], weekId: string): NewsItem[] => {
  const news: NewsItem[] = [];

  currentChart.forEach((entry) => {
    if (entry.rank === 1) return;

    const title = entry.songs.display_title || entry.songs.title || "Unknown Title";
    const artist = entry.songs.artists?.name || "Unknown Artist";
    const woc = entry.weeks_on_chart;
    const rank = entry.rank;
    const prev = entry.previous_position;
    const isNewPeak = entry.is_new_peak;
    const peak = entry.peak_position;

    const jump = prev ? prev - rank : null;
    const moveStr = jump !== null ? (jump > 0 ? `+${jump}` : jump < 0 ? `${jump}` : "=") : "re";
    
    const peakStr = isNewPeak ? "*new peak*" : `*peak: #${peak}*`;
    const subtext = `Personal Hot 100: #${rank}(${moveStr}) ${title}, ${artist} [${woc} weeks]. ${peakStr}`;

    let headline = "";
    let eventType = "";
    let priority = 0;

    const thresholds = [5, 10, 20, 50];
    let crossedThreshold: number | null = null;
    for (const t of thresholds) {
      if (rank <= t && (!prev || prev > t)) {
        crossedThreshold = t;
        break;
      }
    }

    // debuts
    if (woc === 1) {
      eventType = "DEBUT";
      headline = `“${title}” by ${artist} debuts at #${rank} in Personal Hot 100.`;
      priority = rank <= 10 ? 8 : rank <= 40 ? 5 : 3;
    } 
    // re-entries
    else if (!prev && woc > 1) {
      if (crossedThreshold) {
        eventType = `RE_ENTRY_TOP_${crossedThreshold}`;
        headline = `“${title}” by ${artist} reenters inside the top ${crossedThreshold} of Personal Hot 100 at #${rank}.`;
        priority = crossedThreshold <= 10 ? 7 : 5;
      } else if (isNewPeak) {
        eventType = "RE_ENTRY_NEW_PEAK";
        headline = `“${title}” by ${artist} reaches a new peak in Personal Hot 100, reentering at #${rank}.`;
        priority = rank <= 20 ? 7 : 4;
      } else {
        eventType = "RE_ENTRY";
        headline = `“${title}” by ${artist} reenters Personal Hot 100 at #${rank}.`;
        priority = rank <= 40 ? 6 : 3;
      }
    } 
    // climbs crossing a threshold
    else if (jump && jump > 0 && crossedThreshold) {
      eventType = `ENTER_TOP_${crossedThreshold}`;
      headline = `“${title}” by ${artist} climbs inside the top ${crossedThreshold} of Personal Hot 100, rising ${jump} spots to #${rank}.`;
      priority = crossedThreshold <= 10 ? 7 : 5;
    }
    // new peaks
    else if (isNewPeak) {
      eventType = "NEW_PEAK";
      headline = jump && jump > 0
        ? `“${title}” by ${artist} reaches a new peak in Personal Hot 100, rising ${jump} spots to #${rank}.`
        : `“${title}” by ${artist} reaches a new peak in Personal Hot 100 at #${rank}.`;
      priority = rank <= 20 ? 7 : 4;
    } 
    // yearly milestones
    else if (woc % 52 === 0) {
      eventType = "YEARLY_MILESTONE";
      const years = woc / 52;
      const yearText = years === 1 ? "one year" : `${years} years`;
      headline = `“${title}” by ${artist} has now completed ${yearText} (${woc} weeks of charting) in Personal Hot 100.`;
      priority = 9; 
    }
    // milestone weeks
    else if (woc % 10 === 0) {
      eventType = "MILESTONE";
      headline = `“${title}” by ${artist} spends its ${formatOrdinal(woc)} week in Personal Hot 100 this week.`;
      priority = woc >= 50 ? 9 : 6;
    }

    if (headline) {
      news.push({
        week_id: weekId,
        event_type: eventType,
        entity_type: "song",
        entity_id: entry.song_id,
        headline,
        subtext,
        priority,
      });
    }
  });

  return news;
};

export const generateNews = async (isFinalizing?: boolean, overrideTargetDate?: string) => {
  console.log("\nRunning news engine...");
  if (!isFinalizing) {
    console.log("\nWeek not finished yet. Skipping news generation...");
    return;
  }

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
    .select(
      `
      *,
      songs ( id, display_title, title, album_id, artists(id, name) )
    `,
    )
    .eq("week_id", targetWeek.id)
    .order("rank", { ascending: true });

  if (chartError || !currentChart || currentChart.length === 0) {
    console.log("No chart entries found to analyze this week.");
    return;
  }

  const newsItems: NewsItem[] = [];

  console.log("Analyzing chart movements & certifications...");

  const numberOneNews = await detectNumberOnes(currentChart, targetWeek.id);
  newsItems.push(...numberOneNews);
  const certNews = await detectCertifications(targetWeek.id);
  newsItems.push(...certNews);
  const movementNews = detectMovements(currentChart, targetWeek.id);
  newsItems.push(...movementNews);

  if (newsItems.length > 0) {
    console.log(`Writing ${newsItems.length} headline(s) to the news feed...`);

    await supabase.from("news_feed").delete().eq("week_id", targetWeek.id);

    const { error: insertError } = await supabase.from("news_feed").insert(newsItems);

    if (insertError) {
      console.error("Error saving news:", insertError);
    } else {
      console.log("News feed updated successfully!");
    }
  } else {
    console.log("No major news generated this week.");
  }
};
