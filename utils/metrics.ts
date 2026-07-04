import { WEIGHT_STREAMS, WEIGHT_SALES, WEIGHT_AIRPLAY } from "@/config/constants";

export type Metrics = {
  songId: string;
  streams: number;
  sales: number;
  airplay: number;
  rawPoints: number;
};

export const calculateChartMetrics = (
  rawScrobbles: any[],
  canonicalMap: Map<string, string>
): Metrics[] => {
  const weeklyStats = new Map<
    string,
    { streams: number; sales: number; airplay: number; currentStreak: number }
  >();

  let previousCanonicalSongId: string | null = null;

  for (const scrobble of rawScrobbles) {
    const rawSongId = scrobble.song_id;
    const songId = canonicalMap.get(rawSongId) || rawSongId;

    if (!weeklyStats.has(songId)) {
      weeklyStats.set(songId, { streams: 0, sales: 0, airplay: 0, currentStreak: 0 });
    }

    const stats = weeklyStats.get(songId)!;
    stats.streams += 1;

    if (previousCanonicalSongId !== songId) {
      stats.sales += 1;
      if (previousCanonicalSongId && weeklyStats.has(previousCanonicalSongId)) {
        weeklyStats.get(previousCanonicalSongId)!.currentStreak = 0;
      }
    }

    stats.currentStreak += 1;
    stats.airplay = Math.max(stats.airplay, stats.currentStreak);

    previousCanonicalSongId = songId;
  }
  
  return Array.from(weeklyStats.entries()).map(([songId, stats]) => {
    const rawPoints =
      Math.floor(stats.streams * WEIGHT_STREAMS) +
      Math.floor(stats.sales * WEIGHT_SALES) +
      Math.floor(stats.airplay * WEIGHT_AIRPLAY);

    return {
      songId,
      streams: stats.streams,
      sales: stats.sales,
      airplay: stats.airplay,
      rawPoints,
    };
  });
};