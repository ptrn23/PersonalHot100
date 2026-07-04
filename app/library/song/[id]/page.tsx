import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartRow, { DisplayEntry, MaxStats } from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

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

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select(
      `
      headline,
      subtext,
      priority,
      event_type,
      chart_weeks ( start_date )
    `,
    )
    .eq("entity_type", "song")
    .eq("entity_id", resolvedParams.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const songNews =
    (rawSongNews as any[])?.sort((a, b) => {
      const dateA = new Date(a.chart_weeks?.start_date || 0).getTime();
      const dateB = new Date(b.chart_weeks?.start_date || 0).getTime();
      return dateB - dateA;
    }) || [];

  const { data: certs } = await supabase
    .from("certifications")
    .select(
      `
      award_name,
      multiplier,
      chart_weeks ( start_date )
    `,
    )
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
      new Date(a.chart_weeks?.start_date).getTime() - new Date(b.chart_weeks?.start_date).getTime(),
  );

  const descendingEntries = [...entries].sort(
    (a, b) =>
      new Date(b.chart_weeks?.start_date).getTime() - new Date(a.chart_weeks?.start_date).getTime(),
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

    const weeklyStreams = applyDeviation(Math.floor(entry.streams * 5250 * 275), seed + 1);
    const weeklySales = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
    const weeklyAirplay = applyDeviation(Math.floor(entry.airplay * 2250 * 5020), seed + 3);
    const weeklyUnits = applyDeviation(
      Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
      seed + 4,
    );

    if (weeklySales > maxStats.sales) maxStats.sales = weeklySales;
    if (weeklyStreams > maxStats.streams) maxStats.streams = weeklyStreams;
    if (weeklyAirplay > maxStats.airplay) maxStats.airplay = weeklyAirplay;
    if (weeklyUnits > maxStats.units) maxStats.units = weeklyUnits;
  });

  const debutDate = sortedEntries.length > 0 ? sortedEntries[0].chart_weeks?.start_date : null;
  const peakEntry = sortedEntries.find((e) => e.rank === peakPos);
  const firstPeakDate = peakEntry?.chart_weeks?.start_date;
  highestStreak = Math.max(
    0,
    ...sortedEntries.filter((e) => e.rank === peakPos).map((e) => e.peak_streak || 0),
  );

  const allTimeStreams = applyDeviation(Math.floor(rawStreams * 5250 * 275), seed + 1);
  const allTimeSales = applyDeviation(Math.floor(rawSales * 252), seed + 2);
  const allTimeAirplay = applyDeviation(Math.floor(rawAirplay * 2250 * 5020), seed + 3);
  const allTimeUnits = applyDeviation(
    Math.floor((rawStreams + rawSales + rawAirplay) * 1750 * 2),
    seed + 4,
  );

  const historyEntriesForList: DisplayEntry[] = descendingEntries.map((entry) => ({
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
  }));

  const getWeight = (award: string, multi: number) => {
    if (award === "Diamond") return 10000000 * multi;
    if (award === "Platinum") return 1000000 * multi;
    if (award === "Gold") return 500000 * multi;
    return 0;
  };

  const sortedCerts = ((certs as unknown as CertificationData[]) || []).sort(
    (a, b) => getWeight(b.award_name, b.multiplier) - getWeight(a.award_name, a.multiplier),
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
    <main className="min-h-screen bg-[#f5f5f5] pb-24 text-gray-900">
      <div className="mb-8 bg-white p-10 pb-12 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/charts/weekly"
            className="group mb-10 inline-flex items-center gap-2 text-sm font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-black"
          >
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
            Back to Hot 100
          </Link>

          <div className="flex flex-col items-end gap-8 md:flex-row">
            <div className="h-56 w-56 shrink-0 border border-gray-200 bg-gray-100 shadow-xl">
              {coverUrl ? (
                <img src={coverUrl} alt={albumTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400 uppercase">
                  No Cover
                </div>
              )}
            </div>

            <div className="pb-2">
              <p className="mb-2 text-sm font-bold tracking-widest text-gray-500 uppercase">
                Song Profile
              </p>
              <h1 className="mb-3 text-5xl leading-none font-black tracking-tighter uppercase md:text-6xl">
                {song.display_title || song.title}
              </h1>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/library/artist/${artistId}`}
                  className="inline-block text-xl font-bold text-gray-600 transition-colors hover:text-[#B30000]"
                >
                  By {artistName}
                </Link>
                <Link
                  href={`/library/album/${albumId}`}
                  className="inline-block text-sm font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-black"
                >
                  From: {albumTitle}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-10 md:px-0">
        <div className="mb-16">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              className="relative flex h-40 flex-col items-center justify-center overflow-hidden border-2 bg-black"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="z-10 mb-1 text-7xl leading-none font-black tracking-tighter text-white">
                {peakPos === 101 ? "--" : peakPos}
              </span>
              {highestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 rounded-sm px-2 py-0.5 text-[10px] font-black text-white uppercase"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {highestStreak} Wks
                </span>
              )}
              <span className="z-10 mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                Peak Position
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {formatNumber(totalPoints)}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                All-Time Points
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {woc}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                Weeks on Chart
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-3xl font-black tracking-tighter text-[#B30000]">
                {formatNumber(allTimeUnits)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Total Units
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">
                {formatNumber(allTimeStreams)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Streams
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">
                {formatNumber(allTimeSales)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Sales
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">
                {formatNumber(allTimeAirplay)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Airplay
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Debut Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(debutDate)}
              </span>
            </div>
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(firstPeakDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-6 bg-black p-4">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Chart Run</h2>
          </div>
          <div className="rounded-lg border-2 border-gray-200 bg-white p-6 pt-8 shadow-sm">
            <ChartTrajectory songEntries={sortedEntries} allGlobalWeeks={allGlobalWeeks} />
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-6 p-4" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              Week-by-Week History
            </h2>
          </div>

          <div className="overflow-hidden border-t-2 border-black bg-white text-sm shadow-sm">
            {/* The Chart Header */}
            <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] border-b border-gray-300 bg-gray-50 font-bold text-gray-600">
              <div className="py-2 text-center">Rank</div>
              <div className="py-2 text-center">+/-</div>
              <div className="py-2 pl-2">Week</div>
              <div className="py-2 text-center">{}</div>
              <div className="py-2 text-center">Points</div>
              <div className="py-2 text-center">%</div>
              <div className="bg-blue-50/50 py-2 text-center">Peak</div>
              <div className="py-2 text-center">WoC</div>
              <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">Sales</div>
              <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">%</div>
              <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">Streams</div>
              <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">%</div>
              <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">Airplay</div>
              <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">%</div>
              <div className="bg-[#eddcfe] py-2 text-center text-[#721a46]">Units</div>
            </div>

            <div className="flex flex-col">
              {historyEntriesForList.map((entry) => (
                <ChartRow key={entry.id} entry={entry} week={entry.id} maxStats={maxStats} />
              ))}
              {historyEntriesForList.length === 0 && (
                <div className="p-10 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
                  No chart history found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-4 p-4" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              News & Feed
            </h2>
          </div>

          <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            {songNews.length > 0 ? (
              <div className="flex flex-col">
                {songNews.slice(0, 10).map((news, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer flex-row border-b border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="mr-3 shrink-0">
                      <div className="h-12 w-12 rounded-full bg-[#B30000] shadow-inner"></div>
                    </div>

                    <div className="flex w-full flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center overflow-hidden text-[15px] whitespace-nowrap text-gray-500">
                          <span className="truncate font-bold text-gray-900 hover:underline">
                            Personal Hot 100
                          </span>

                          <svg
                            viewBox="0 0 24 24"
                            aria-label="Verified account"
                            className="ml-1 h-5 w-5 shrink-0 fill-[#B30000] text-blue-500"
                          >
                            <g>
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.52.828 2.85 2.043 3.52-.05.302-.076.612-.076.93 0 2.21 1.71 4 3.918 4 .47 0 .92-.086 1.336-.253C9.184 22.585 10.49 23.5 12 23.5s2.816-.917 3.337-2.25c.416.167.866.252 1.336.252 2.21 0 3.918-1.79 3.918-4 0-.318-.025-.628-.076-.928C21.672 15.35 22.5 14.02 22.5 12.5zM10.23 17.338l-3.21-3.593 1.494-1.336 1.636 1.83 4.22-5.74 1.614 1.187-5.754 7.653z"></path>
                            </g>
                          </svg>

                          <span className="ml-1 truncate">@personalhot100</span>
                          <span className="mx-1.5">·</span>
                          <span className="shrink-0 hover:underline">
                            {new Date(news.chart_weeks?.start_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="-mt-2 -mr-2 rounded-full p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-500">
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                            <g>
                              <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path>
                            </g>
                          </svg>
                        </div>
                      </div>

                      <div className="mt-1 text-[15px] leading-normal text-gray-900">
                        <p>{news.headline}</p>
                        {news.subtext && <p className="mt-2 text-gray-600">{news.subtext}</p>}
                      </div>

                      <div className="mt-3 flex w-full items-center justify-between text-gray-500">
                        <div className="flex w-full max-w-[400px] justify-between">
                          <div className="group flex items-center">
                            <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                                <g>
                                  <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                                </g>
                              </svg>
                            </div>
                          </div>
                          <div className="group flex items-center">
                            <div className="rounded-full p-2 transition-colors group-hover:bg-green-50 group-hover:text-green-500">
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                                <g>
                                  <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                                </g>
                              </svg>
                            </div>
                          </div>
                          <div className="group flex items-center">
                            <div className="rounded-full p-2 transition-colors group-hover:bg-pink-50 group-hover:text-pink-500">
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                                <g>
                                  <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="rounded-full p-2 transition-colors hover:bg-blue-50 hover:text-blue-500">
                            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                              <g>
                                <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5h-11z"></path>
                              </g>
                            </svg>
                          </div>
                          <div className="-mr-2 rounded-full p-2 transition-colors hover:bg-blue-50 hover:text-blue-500">
                            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                              <g>
                                <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-16 text-center">
                <span className="mb-2 text-lg font-bold text-gray-400">No updates yet</span>
                <span className="text-sm text-gray-400">
                  When this track hits milestones, they will appear here.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-6 bg-black p-4">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              Certifications
            </h2>
          </div>

          {sortedCerts.length > 0 ? (
            <div className="grid grid-cols-1 items-center gap-8 border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-3 md:p-8">
              <div className="flex w-full items-center justify-center">
                <PlaqueDisc
                  awardName={highestCert.award_name}
                  multiplier={highestCert.multiplier}
                />
              </div>

              <div className="w-full md:col-span-2">
                <div className="mb-6 grid grid-cols-1 gap-x-8 gap-y-4 border-b border-gray-200 pb-6 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                      Release Date
                    </div>
                    <div className="text-lg font-medium text-gray-900">--</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                      Format
                    </div>
                    <div className="text-lg font-medium text-gray-900">Single</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                      Certified Units
                    </div>
                    <div className="text-lg font-black text-black">{certifiedUnits} Million</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                      Genre
                    </div>
                    <div className="text-lg font-medium text-gray-900">--</div>
                  </div>
                </div>

                <div>
                  <div className="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Previous Certifications
                  </div>
                  <ul className="space-y-3">
                    {sortedCerts.map((cert, index) => (
                      <li key={index} className="flex items-center text-sm md:text-base">
                        <span className="w-32 shrink-0 font-black text-black">
                          {formatCertTitle(cert.award_name, cert.multiplier)}
                        </span>
                        <span className="mx-3 text-gray-300">|</span>
                        <span className="font-medium text-gray-600">
                          {formatFullDate(cert.chart_weeks?.start_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <span className="text-sm font-bold tracking-widest text-gray-400 uppercase">
                (No Certifications Yet)
              </span>
            </div>
          )}
        </div>

        <div className="mb-16">
          <div className="mb-6 bg-black p-4">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Records</h2>
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <span className="text-sm font-bold tracking-widest text-gray-400 uppercase">
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
  multiplier,
}: {
  awardName: "Gold" | "Platinum" | "Diamond";
  multiplier: number;
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
    <div className="relative flex aspect-square w-full max-w-[200px] items-center justify-center">
      {Array.from({ length: displayCount }).map((_, i) => {
        const isLast = i === displayCount - 1;
        const yOffset = (i - (displayCount - 1) / 2) * 24;
        const xOffset = (i - (displayCount - 1) / 2) * 0;

        return (
          <div
            key={i}
            className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-full shadow-md ${theme.outer}`}
            style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }}
          >
            <div className={`absolute inset-2 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-4 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-8 rounded-full border-[1px] ${theme.grooves}`} />
            <div className={`absolute inset-16 rounded-full border-[1px] ${theme.grooves}`} />

            <div className={`absolute inset-0 ${theme.shine} mix-blend-overlay`} />

            <div
              className={`relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 bg-white shadow-lg ${theme.labelBorder} z-10`}
            >
              {isLast ? (
                isMulti ? (
                  <>
                    <span className="text-2xl leading-none font-black tracking-tighter text-gray-900">
                      {multiplier}X
                    </span>
                    <span
                      className={`-mt-0.5 text-[8px] font-black tracking-widest uppercase ${theme.text}`}
                    >
                      {awardName}
                    </span>
                  </>
                ) : (
                  <span
                    className={`text-[11px] font-black tracking-widest uppercase ${theme.text}`}
                  >
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
