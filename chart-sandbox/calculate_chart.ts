import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Database } from '../types/supabase';

dotenv.config({ path: '.env.local' });

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

async function runChartEngine() {
  console.log("🚀 Booting up Personal Hot 100 Chart Engine...");

  const { data: weeks, error: weeksError } = await supabase
    .from('chart_weeks')
    .select('*')
    .order('start_date', { ascending: true });

  if (weeksError || !weeks) {
    console.error("❌ Failed to fetch chart weeks:", weeksError);
    return;
  }

  console.log(`📅 Found ${weeks.length} weeks to process.\n`);

  const globalSongHistory = new Map<string, { peak: number; woc: number }>();
  
  for (let i = 0; i < weeks.length; i++) {
    const currentWeek = weeks[i];
    const previousWeek = i > 0 ? weeks[i - 1] : null;
    const twoWeeksAgo = i > 1 ? weeks[i - 2] : null;

    console.log(`\n📊 Processing Week: ${currentWeek.start_date}`);

    const { data: rawScrobbles, error: scrobbleError } = await supabase
      .from('scrobbles')
      .select('song_id, listened_at')
      .gte('listened_at', currentWeek.start_date)
      .lt('listened_at', currentWeek.end_date)
      .order('listened_at', { ascending: true });

    if (scrobbleError || !rawScrobbles || rawScrobbles.length === 0) {
      console.log(`⚠️ No scrobbles found for this week. Skipping.`);
      continue;
    }

    const weeklyStats = new Map<string, { streams: number; sales: number; airplay: number; currentStreak: number }>();
    let previousSongId: string | null = null;

    for (const scrobble of rawScrobbles) {
      const songId = scrobble.song_id;

      if (!weeklyStats.has(songId)) {
        weeklyStats.set(songId, { streams: 0, sales: 0, airplay: 0, currentStreak: 0 });
      }

      const stats = weeklyStats.get(songId)!;

      stats.streams += 1;

      if (previousSongId !== songId) {
        stats.sales += 1;
        if (previousSongId && weeklyStats.has(previousSongId)) {
          weeklyStats.get(previousSongId)!.currentStreak = 0;
        }
      }

      stats.currentStreak += 1;
      stats.airplay = Math.max(stats.airplay, stats.currentStreak);

      previousSongId = songId;
    }

    let lastWeekChart: Record<string, any> = {};
    if (previousWeek) {
      const { data } = await supabase.from('chart_entries').select('song_id, total_points, rank').eq('week_id', previousWeek.id);
      lastWeekChart = data?.reduce((acc, row) => ({ ...acc, [row.song_id]: row }), {}) || {};
    }

    let twoWeeksAgoChart: Record<string, any> = {};
    if (twoWeeksAgo) {
      const { data } = await supabase.from('chart_entries').select('song_id, total_points').eq('week_id', twoWeeksAgo.id);
      twoWeeksAgoChart = data?.reduce((acc, row) => ({ ...acc, [row.song_id]: row }), {}) || {};
    }
    
    const chartContenders = [];

    for (const [songId, stats] of weeklyStats.entries()) {
      const rawPoints = Math.floor(stats.streams * 5) + Math.floor(stats.sales * 3) + Math.floor(stats.airplay * 2);

      const prevPoints = lastWeekChart[songId]?.total_points || 0;
      const twoWeeksPoints = twoWeeksAgoChart[songId]?.total_points || 0;
      const finalWeightedPoints = Math.floor(
        rawPoints + Math.floor(prevPoints * 0.3) + Math.floor(twoWeeksPoints * 0.2)
      );

      chartContenders.push({
        song_id: songId,
        streams: stats.streams,
        sales: stats.sales,
        airplay: stats.airplay,
        rawPoints,
        prevPoints,
        twoWeeksPoints,
        total_points: finalWeightedPoints,
      });
    }

    chartContenders.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.rawPoints !== a.rawPoints) return b.rawPoints - a.rawPoints;
      return b.streams - a.streams;
    });

    const top100 = chartContenders.slice(0, 100);
    const finalTop100ToInsert: any[] = [];

    top100.forEach((entry, index) => {
      const rank = index + 1;
      
      const history = globalSongHistory.get(entry.song_id) || { peak: 101, woc: 0 };

      const isNewPeak = rank < history.peak;
      const isRepeak = rank === history.peak && rank !== 101;
      const peak_position = Math.min(rank, history.peak);
      const weeks_on_chart = history.woc + 1;
      globalSongHistory.set(entry.song_id, { peak: peak_position, woc: weeks_on_chart });

      finalTop100ToInsert.push({
        week_id: currentWeek.id,
        song_id: entry.song_id,
        rank: rank,
        previous_position: lastWeekChart[entry.song_id]?.rank || null,
        peak_position: peak_position,
        weeks_on_chart: weeks_on_chart,
        is_new_peak: isNewPeak,
        is_repeak: isRepeak,
        streams: entry.streams,
        sales: entry.sales,
        airplay: entry.airplay,
        current_week_points: entry.rawPoints,
        previous_week_raw_points: entry.prevPoints,
        two_weeks_ago_raw_points: entry.twoWeeksPoints,
        total_points: entry.total_points
      });
    });

    const { error: insertError } = await supabase
      .from('chart_entries')
      .upsert(finalTop100ToInsert, { onConflict: 'week_id, song_id' });
    
    if (insertError) {
      console.error("❌ Failed to insert Top 100:", insertError);
    } else {
      console.log(`✅ Saved Top 100! (Rank 1: ${top100[0].total_points} pts)`);
    }
  }
  
  console.log("\n🎉 Chart Engine has finished processing all weeks!");
}

runChartEngine();