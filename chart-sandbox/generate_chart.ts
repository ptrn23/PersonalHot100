import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

class PointsCalculator {
  static streamsWeight = 5000;
  static salesWeight = 3000;
  static airplayWeight = 2000;

  static calculateRawPoints(
    streams: number,
    sales: number,
    airplay: number,
  ): number {
    const streamPts = Math.floor((streams * this.streamsWeight) / 1000);
    const salePts = Math.floor((sales * this.salesWeight) / 1000);
    const airPts = Math.floor((airplay * this.airplayWeight) / 1000);
    return streamPts + salePts + airPts;
  }

  static calculateWeightedPoints(
    currentPoints: number,
    prevPoints: number,
    twoWeeksAgoPoints: number,
  ): number {
    return Math.floor(
      currentPoints +
        Math.floor(prevPoints * 0.3) +
        Math.floor(twoWeeksAgoPoints * 0.2),
    );
  }
}

async function generateWeeklyChart() {
  console.log("🚀 Starting Chart Generation Engine...");

  const { data: week, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (weekErr || !week) return console.error("Could not find a chart week.");
  console.log(
    `\n📅 Generating chart for week: ${week.start_date} to ${week.end_date}`,
  );

  const { data: scrobbles, error: scrobbleErr } = await supabase
    .from("scrobbles")
    .select(
      `
      song_id,
      songs ( title, artists ( name ) )
    `,
    )
    .order("listened_at", { ascending: true });

  if (scrobbleErr) return console.error(scrobbleErr);
  if (!scrobbles || scrobbles.length === 0)
    return console.log("No scrobbles found.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metricsMap = new Map<string, any>();
  let previousSongId = "";

  for (const scrobble of scrobbles) {
    const sid = scrobble.song_id;

    if (!metricsMap.has(sid)) {
      metricsMap.set(sid, {
        song_id: sid,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (scrobble.songs as any).title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        artist: (scrobble.songs as any).artists.name,
        streams: 0,
        sales: 0,
        airplay: 0,
        _currentStreak: 0,
      });
    }

    const metrics = metricsMap.get(sid);
    metrics.streams += 1;

    if (sid === previousSongId) {
      metrics._currentStreak += 1;
    } else {
      metrics.sales += 1;
      metrics._currentStreak = 1;
    }

    if (metrics._currentStreak > metrics.airplay) {
      metrics.airplay = metrics._currentStreak;
    }
    previousSongId = sid;
  }

  const chart = Array.from(metricsMap.values());

  for (const entry of chart) {
    entry.current_week_points = PointsCalculator.calculateRawPoints(
      entry.streams,
      entry.sales,
      entry.airplay,
    );
    entry.total_points = PointsCalculator.calculateWeightedPoints(
      entry.current_week_points,
      0,
      0,
    );
  }

  chart.sort((a, b) => b.total_points - a.total_points);

  console.log(`\n🏆 TOP 5 PREVIEW 🏆`);

  const entriesToInsert = chart.map((entry, index) => {
    const rank = index + 1;

    if (rank <= 5) {
      console.log(
        `#${rank}: ${entry.title} by ${entry.artist} | Pts: ${entry.total_points} (Streams: ${entry.streams}, Sales: ${entry.sales}, Airplay: ${entry.airplay})`,
      );
    }

    return {
      week_id: week.id,
      song_id: entry.song_id,
      rank: rank,
      previous_position: null,
      peak_position: rank,
      weeks_on_chart: 1,
      is_new_peak: true,
      streams: entry.streams,
      sales: entry.sales,
      airplay: entry.airplay,
      current_week_points: entry.current_week_points,
      total_points: entry.total_points,
    };
  });

  console.log(
    `\n💾 Saving ${entriesToInsert.length} chart entries to Supabase...`,
  );
  const { error: insertErr } = await supabase
    .from("chart_entries")
    .upsert(entriesToInsert, { onConflict: "week_id,song_id" });

  if (insertErr) console.error("Error saving chart:", insertErr);
  else console.log("✅ Chart successfully saved to the database!");
}

generateWeeklyChart();
