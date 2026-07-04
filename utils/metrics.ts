import { WEIGHT_STREAMS, WEIGHT_SALES, WEIGHT_AIRPLAY } from "@/config/constants";
import { MaxStats } from "@/types";

export type Metrics = {
  songId: string;
  streams: number;
  sales: number;
  airplay: number;
  rawPoints: number;
};

export const getStableSeed = (seedString: string): number => {
  let hash = 5381;
  
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) + hash) + seedString.charCodeAt(i); 
  }
  
  return Math.abs(hash);
};

export const applyDeviation = (
  base: number, 
  seed: number, 
  scale: number = 0.1
): number => {
  const pseudoRandomFloat = Math.abs(Math.sin(seed)); 
  
  const deviation = (pseudoRandomFloat - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};

export const calculateUnits = (
  streams: number,
  sales: number,
  airplay: number,
  title: string,
  artist: string
): number => {
  const base = Math.floor((streams + sales + airplay) * 3500);
  const seedString = `${title}|${artist}`; 
  const seed = getStableSeed(seedString);
  return applyDeviation(base, seed + 4);
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

export type CalculatedUnits = {
  streamsUnits: number;
  salesUnits: number;
  airplayUnits: number;
  totalUnits: number;
};

export const calculateDetailedUnits = (
  streams: number,
  sales: number,
  airplay: number,
  seedString: string
): CalculatedUnits => {
  const seed = getStableSeed(seedString);

  return {
    streamsUnits: applyDeviation(Math.floor(streams * 5250 * 275), seed + 1),
    salesUnits: applyDeviation(Math.floor(sales * 252), seed + 2),
    airplayUnits: applyDeviation(Math.floor(airplay * 2250 * 5020), seed + 3),
    totalUnits: applyDeviation(Math.floor((streams + sales + airplay) * 3500), seed + 4),
  };
};

export const calculateMaxStats = (
  entries: { streams: number; sales: number; airplay: number; mathSeedString: string }[]
): MaxStats => {
  const max: MaxStats = { sales: 0, streams: 0, airplay: 0, units: 0 };

  for (const entry of entries) {
    const units = calculateDetailedUnits(
      entry.streams,
      entry.sales,
      entry.airplay,
      entry.mathSeedString
    );

    if (units.salesUnits > max.sales) max.sales = units.salesUnits;
    if (units.streamsUnits > max.streams) max.streams = units.streamsUnits;
    if (units.airplayUnits > max.airplay) max.airplay = units.airplayUnits;
    if (units.totalUnits > max.units) max.units = units.totalUnits;
  }

  return max;
};