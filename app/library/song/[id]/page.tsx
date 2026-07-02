import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartRow, { DisplayEntry, MaxStats } from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const { data: song } = await supabase
    .from("songs")
    .select(
      `
      title,
      display_title,
      artists (name),
      albums (cover_url)
    `,
    )
    .eq("id", resolvedParams.id)
    .single();

  if (!song) {
    return { title: "Song Not Found | Personal Hot 100" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (song.artists as any)?.name || "Unknown Artist";
  const pageTitle = `${song.display_title || song.title} | Personal Hot 100`;
  const description = `View chart performance, total points, and track history for "${song.display_title || song.title}" by ${artistName}.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
    },
  };
}

const ACCENT_COLOR = "#B30000";

const formatNumber = (num: number) => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

const formatBillboardDate = (isoString?: string) => {
  if (!isoString) return "--";
  const d = new Date(isoString);
  const m = d.getMonth() + 1;
  const day = d.getDate().toString().padStart(2, "0");
  const y = d.getFullYear().toString().slice(2);
  return `${m}/${day}/${y}`;
};

const formatFullDate = (isoString?: string) => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

const getStableSeed = (title: string, artist: string) => {
  const combo = `${title}|${artist}`;
  let hash = 0;
  for (let i = 0; i < combo.length; i++) {
    hash += (i + 1) * combo.charCodeAt(i);
  }
  return hash;
};

const applyDeviation = (base: number, seed: number, scale = 0.1, mod = 100) => {
  const deviation = ((seed % mod) / mod - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};

type CertificationData = {
  award_name: "Gold" | "Platinum" | "Diamond";
  multiplier: number;
  chart_weeks: {
    start_date: string;
  };
};

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const { data: liveWeek } = await supabase
    .from("chart_weeks")
    .select("id")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  const { data: song, error } = await supabase
    .from("songs")
    .select(
      `
      *,
      artists ( id, name ),
      albums ( id, title, cover_url ),
      chart_entries (
        id,
        week_id,
        rank,
        previous_position,
        is_new_peak,
        is_repeak,
        total_points,
        current_week_points,
        previous_week_raw_points,
        two_weeks_ago_raw_points,
        streams,
        sales,
        airplay,
        peak_position,
        peak_streak,
        weeks_on_chart,
        chart_weeks ( start_date )
      )
    `,
    )
    .eq("id", resolvedParams.id)
    .single();

  const { data: allWeeksData } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .neq("id", liveWeek?.id)
    .order("start_date", { ascending: true });

  const { data: rawSongNews, error: newsError } = await supabase
    .from("news_feed")
    .select(`
      headline,
      subtext,
      priority,
      event_type,
      chart_weeks ( start_date )
    `)
    .eq("entity_type", "song")
    .eq("entity_id", resolvedParams.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const songNews = (rawSongNews as any[])?.sort((a, b) => {
    const dateA = new Date(a.chart_weeks?.start_date || 0).getTime();
    const dateB = new Date(b.chart_weeks?.start_date || 0).getTime();
    return dateB - dateA;
  }) || [];

  const { data: certs } = await supabase
    .from("certifications")
    .select(`
      award_name,
      multiplier,
      chart_weeks ( start_date )
    `)
    .eq("song_id", resolvedParams.id);

  const allGlobalWeeks = allWeeksData?.map((w) => w.start_date) || [];

  if (error || !song) {
    return <div className="p-10 font-bold text-red-500">Song not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (song.artists as any)?.name || "Unknown Artist";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistId = (song.artists as any)?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumTitle = (song.albums as any)?.title || "Unknown Album";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumId = (song.albums as any)?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverUrl = (song.albums as any)?.cover_url;

  let totalPoints = 0;
  let rawStreams = 0;
  let rawSales = 0;
  let rawAirplay = 0;
  let peakPos = 101;
  let woc = 0;
  let highestStreak = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEntries = (song.chart_entries as any[]) || [];
  const entries = rawEntries.filter((entry) => entry.week_id !== liveWeek?.id);

  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.chart_weeks?.start_date).getTime() -
      new Date(b.chart_weeks?.start_date).getTime(),
  );

  const descendingEntries = [...entries].sort(
    (a, b) =>
      new Date(b.chart_weeks?.start_date).getTime() -
      new Date(a.chart_weeks?.start_date).getTime(),
  );

  const seed = getStableSeed(song.display_title || song.title, artistName);
  const maxStats: MaxStats = { sales: 0, streams: 0, airplay: 0, units: 0 };

  sortedEntries.forEach((entry) => {
    totalPoints += entry.total_points || 0;
    rawStreams += entry.streams || 0;
    rawSales += entry.sales || 0;
    rawAirplay += entry.airplay || 0;

    if (entry.peak_position < peakPos) peakPos = entry.peak_position;
    if (entry.weeks_on_chart > woc) woc = entry.weeks_on_chart;

    const weeklyStreams = applyDeviation(
      Math.floor(entry.streams * 5250 * 275),
      seed + 1,
    );
    const weeklySales = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
    const weeklyAirplay = applyDeviation(
      Math.floor(entry.airplay * 2250 * 5020),
      seed + 3,
    );
    const weeklyUnits = applyDeviation(
      Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
      seed + 4,
    );

    if (weeklySales > maxStats.sales) maxStats.sales = weeklySales;
    if (weeklyStreams > maxStats.streams) maxStats.streams = weeklyStreams;
    if (weeklyAirplay > maxStats.airplay) maxStats.airplay = weeklyAirplay;
    if (weeklyUnits > maxStats.units) maxStats.units = weeklyUnits;
  });

  const debutDate =
    sortedEntries.length > 0 ? sortedEntries[0].chart_weeks?.start_date : null;
  const peakEntry = sortedEntries.find((e) => e.rank === peakPos);
  const firstPeakDate = peakEntry?.chart_weeks?.start_date;
  highestStreak = Math.max(
    0,
    ...sortedEntries
      .filter((e) => e.rank === peakPos)
      .map((e) => e.peak_streak || 0),
  );

  const allTimeStreams = applyDeviation(
    Math.floor(rawStreams * 5250 * 275),
    seed + 1,
  );
  const allTimeSales = applyDeviation(Math.floor(rawSales * 252), seed + 2);
  const allTimeAirplay = applyDeviation(
    Math.floor(rawAirplay * 2250 * 5020),
    seed + 3,
  );
  const allTimeUnits = applyDeviation(
    Math.floor((rawStreams + rawSales + rawAirplay) * 1750 * 2),
    seed + 4,
  );

  const historyEntriesForList: DisplayEntry[] = descendingEntries.map(
    (entry) => ({
      id: entry.id,
      rank: entry.rank,
      previousRank: entry.previous_position,

      coverUrl: coverUrl,
      primaryText: song.display_title || song.title,
      primaryHref: null,

      secondaryText: formatFullDate(entry.chart_weeks?.start_date),
      secondaryHref: `/charts/weekly?week=${encodeURIComponent(entry.chart_weeks?.start_date)}`,

      mathSeedString: `${song.display_title || song.title}|${artistName}`,

      isNewPeak: entry.is_new_peak || false,
      isRePeak: entry.is_repeak || false,
      peakPosition: entry.peak_position || 101,
      peakStreak: entry.peak_streak || null,
      weeksOnChart: entry.weeks_on_chart || 1,
      totalPoints: entry.total_points || 0,
      currentWeekPoints: entry.current_week_points || 0,
      previousWeekRawPoints: entry.previous_week_raw_points || null,
      twoWeeksAgoRawPoints: entry.two_weeks_ago_raw_points || null,
      sales: entry.sales || 0,
      streams: entry.streams || 0,
      airplay: entry.airplay || 0,
    }),
  );

  const getWeight = (award: string, multi: number) => {
    if (award === "Diamond") return 10000000 * multi;
    if (award === "Platinum") return 1000000 * multi;
    if (award === "Gold") return 500000 * multi;
    return 0;
  };

  const sortedCerts = ((certs as unknown as CertificationData[]) || []).sort(
    (a, b) => getWeight(b.award_name, b.multiplier) - getWeight(a.award_name, a.multiplier)
  );

  const highestCert = sortedCerts[0];
  const certifiedUnits = highestCert
    ? (getWeight(highestCert.award_name, highestCert.multiplier) / 1000000).toFixed(0)
    : "0";

  const formatCertTitle = (award: string, multi: number) => {
    if (award === "Gold") return "Gold";
    if (multi === 1) return award;
    return `${multi}x ${award}`;
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pb-24">
      <div className="bg-white p-10 pb-12 shadow-sm mb-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/charts/weekly"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest mb-10 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Back to Hot 100
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="w-56 h-56 shrink-0 bg-gray-100 shadow-xl border border-gray-200">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={albumTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-sm">
                  No Cover
                </div>
              )}
            </div>

            <div className="pb-2">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">
                Song Profile
              </p>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3">
                {song.display_title || song.title}
              </h1>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/library/artist/${artistId}`}
                  className="text-xl font-bold text-gray-600 hover:text-[#B30000] transition-colors inline-block"
                >
                  By {artistName}
                </Link>
                <Link
                  href={`/library/album/${albumId}`}
                  className="text-sm font-bold text-gray-400 hover:text-black transition-colors inline-block uppercase tracking-widest"
                >
                  From: {albumTitle}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 md:px-0">
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div
              className="bg-black border-2 flex flex-col justify-center items-center h-40 relative overflow-hidden"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="text-white text-7xl font-black tracking-tighter leading-none mb-1 z-10">
                {peakPos === 101 ? "--" : peakPos}
              </span>
              {highestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {highestStreak} Wks
                </span>
              )}
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-2 z-10">
                Peak Position
              </span>
            </div>

            <div
              className="bg-black border-2 flex flex-col justify-center items-center h-40"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="text-white text-6xl font-black tracking-tighter leading-none mb-1">
                {formatNumber(totalPoints)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-2">
                All-Time Points
              </span>
            </div>

            <div
              className="bg-black border-2 flex flex-col justify-center items-center h-40"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="text-white text-6xl font-black tracking-tighter leading-none mb-1">
                {woc}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-2">
                Weeks on Chart
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-3xl font-black text-[#B30000] tracking-tighter">
                {formatNumber(allTimeUnits)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Total Units
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {formatNumber(allTimeStreams)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Streams
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {formatNumber(allTimeSales)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Sales
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {formatNumber(allTimeAirplay)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Airplay
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 border border-gray-200 p-4 flex justify-between items-center px-8">
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Debut Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(debutDate)}
              </span>
            </div>
            <div className="bg-gray-100 border border-gray-200 p-4 flex justify-between items-center px-8">
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(firstPeakDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6 bg-black">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Chart Run
            </h2>
          </div>
          <div className="bg-white border-2 border-gray-200 shadow-sm rounded-lg p-6 pt-8">
            <ChartTrajectory
              songEntries={sortedEntries}
              allGlobalWeeks={allGlobalWeeks}
            />
          </div>
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Week-by-Week History
            </h2>
          </div>

          <div className="text-sm border-t-2 border-black shadow-sm bg-white overflow-hidden">
            {/* The Chart Header */}
            <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50">
              <div className="py-2 text-center">Rank</div>
              <div className="py-2 text-center">+/-</div>
              <div className="py-2 pl-2">Week</div>
              <div className="py-2 text-center">{}</div>
              <div className="py-2 text-center">Points</div>
              <div className="py-2 text-center">%</div>
              <div className="py-2 text-center bg-blue-50/50">Peak</div>
              <div className="py-2 text-center">WoC</div>
              <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                Sales
              </div>
              <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                %
              </div>
              <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                Streams
              </div>
              <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                %
              </div>
              <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                Airplay
              </div>
              <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                %
              </div>
              <div className="py-2 text-center text-[#721a46] bg-[#eddcfe]">
                Units
              </div>
            </div>

            <div className="flex flex-col">
              {historyEntriesForList.map((entry) => (
                <ChartRow
                  key={entry.id}
                  entry={entry}
                  week={entry.id}
                  maxStats={maxStats}
                />
              ))}
              {historyEntriesForList.length === 0 && (
                <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                  No chart history found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="p-4 mb-4" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              News & Feed
            </h2>
          </div>

          <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
            
            {songNews.length > 0 ? (
              <div className="flex flex-col">
                {songNews.slice(0, 10).map((news, i) => (
                  <div
                    key={i}
                    className="flex flex-row p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="mr-3 shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#B30000] shadow-inner"></div>
                    </div>

                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center text-[15px] text-gray-500 whitespace-nowrap overflow-hidden">
                          <span className="font-bold text-gray-900 hover:underline truncate">
                            Personal Hot 100
                          </span>
                          
                          <svg viewBox="0 0 24 24" aria-label="Verified account" className="w-5 h-5 ml-1 text-blue-500 fill-[#B30000] shrink-0">
                            <g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.52.828 2.85 2.043 3.52-.05.302-.076.612-.076.93 0 2.21 1.71 4 3.918 4 .47 0 .92-.086 1.336-.253C9.184 22.585 10.49 23.5 12 23.5s2.816-.917 3.337-2.25c.416.167.866.252 1.336.252 2.21 0 3.918-1.79 3.918-4 0-.318-.025-.628-.076-.928C21.672 15.35 22.5 14.02 22.5 12.5zM10.23 17.338l-3.21-3.593 1.494-1.336 1.636 1.83 4.22-5.74 1.614 1.187-5.754 7.653z"></path></g>
                          </svg>

                          <span className="ml-1 truncate">@personalhot100</span>
                          <span className="mx-1.5">·</span>
                          <span className="hover:underline shrink-0">
                            {new Date(news.chart_weeks?.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="text-gray-500 hover:bg-blue-50 hover:text-blue-500 p-2 -mt-2 -mr-2 rounded-full transition-colors">
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                            <g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g>
                          </svg>
                        </div>
                      </div>

                      <div className="mt-1 text-[15px] text-gray-900 leading-normal">
                        <p>{news.headline}</p>
                        {news.subtext && (
                          <p className="mt-2 text-gray-600">{news.subtext}</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-3 text-gray-500 w-full">
                        <div className="flex justify-between w-full max-w-[400px]">
                          <div className="flex items-center group">
                            <div className="p-2 -ml-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>
                            </div>
                          </div>
                          <div className="flex items-center group">
                            <div className="p-2 rounded-full group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>
                            </div>
                          </div>
                          <div className="flex items-center group">
                            <div className="p-2 rounded-full group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors">
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5h-11z"></path></g></svg>
                          </div>
                          <div className="p-2 -mr-2 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors">
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-16">
                <span className="text-gray-400 font-bold text-lg mb-2">No updates yet</span>
                <span className="text-gray-400 text-sm">When this track hits milestones, they will appear here.</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6 bg-black">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Certifications
            </h2>
          </div>

          {sortedCerts.length > 0 ? (
            <div className="bg-white border border-gray-200 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex justify-center items-center w-full">
                <PlaqueDisc 
                  awardName={highestCert.award_name} 
                  multiplier={highestCert.multiplier} 
                />
              </div>

              <div className="md:col-span-2 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 border-b border-gray-200 pb-6 mb-6">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Release Date</div>
                    <div className="text-lg font-medium text-gray-900">--</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Format</div>
                    <div className="text-lg font-medium text-gray-900">Single</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Certified Units</div>
                    <div className="text-lg font-black text-black">{certifiedUnits} Million</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Genre</div>
                    <div className="text-lg font-medium text-gray-900">--</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Previous Certifications
                  </div>
                  <ul className="space-y-3">
                    {sortedCerts.map((cert, index) => (
                      <li key={index} className="flex items-center text-sm md:text-base">
                        <span className="font-black text-black w-32 shrink-0">
                          {formatCertTitle(cert.award_name, cert.multiplier)}
                        </span>
                        <span className="text-gray-300 mx-3">|</span>
                        <span className="text-gray-600 font-medium">
                          {formatFullDate(cert.chart_weeks?.start_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-center p-12">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                (No Certifications Yet)
              </span>
            </div>
          )}
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6 bg-black">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Records
            </h2>
          </div>
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-12">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              (Records pending...)
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

const PlaqueDisc = ({ 
  awardName, 
  multiplier 
}: { 
  awardName: "Gold" | "Platinum" | "Diamond", 
  multiplier: number 
}) => {
  const themes = {
    Gold: {
      outer: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-yellow-900/50",
      grooves: "border-yellow-900/20",
      labelBorder: "border-yellow-400",
      text: "text-yellow-700",
      shine: "bg-gradient-to-tr from-white/20 via-white/60 to-transparent",
    },
    Platinum: {
      outer: "bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 shadow-gray-900/50",
      grooves: "border-gray-800/20",
      labelBorder: "border-gray-300",
      text: "text-gray-700",
      shine: "bg-gradient-to-tr from-white/40 via-white/80 to-transparent",
    },
    Diamond: {
      outer: "bg-gradient-to-br from-indigo-100 via-cyan-200 to-emerald-100 shadow-cyan-900/30",
      grooves: "border-cyan-600/20",
      labelBorder: "border-cyan-200",
      text: "text-cyan-800",
      shine: "bg-gradient-to-tr from-white/60 via-white/90 to-white/20",
    },
  };

  const theme = themes[awardName] || themes.Gold;
  const displayCount = Math.min(multiplier, 9);
  const isMulti = multiplier >= 2;

  return (
    <div className="relative w-full max-w-[200px] aspect-square flex items-center justify-center">
      {Array.from({ length: displayCount }).map((_, i) => {
        const isLast = i === displayCount - 1;
        const yOffset = (i - (displayCount - 1) / 2) * 24;
        const xOffset = (i - (displayCount - 1) / 2) * 0;

        return (
          <div
            key={i}
            className={`absolute inset-0 rounded-full shadow-md flex items-center justify-center overflow-hidden ${theme.outer}`}
            style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }}
          >
            <div className={`absolute inset-2 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-4 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-8 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-16 rounded-full border-[1px] ${theme.grooves}`} />
            
            <div className={`absolute inset-0 ${theme.shine} mix-blend-overlay`} />

            <div
              className={`relative w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-lg border-4 ${theme.labelBorder} z-10`}
            >
              {isLast ? (
                isMulti ? (
                  <>
                    <span className="text-2xl font-black text-gray-900 leading-none tracking-tighter">
                      {multiplier}X
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-widest -mt-0.5 ${theme.text}`}>
                      {awardName}
                    </span>
                  </>
                ) : (
                  <span className={`text-[11px] font-black uppercase tracking-widest ${theme.text}`}>
                    {awardName}
                  </span>
                )
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
