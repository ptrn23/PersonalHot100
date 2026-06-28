import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartRow, { DisplayEntry, MaxStats } from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";
import { Metadata } from "next";

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
          <div className="p-4 mb-6 bg-black">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Certifications
            </h2>
          </div>

          {sortedCerts.length > 0 ? (
            <div className="bg-white border border-gray-200 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex justify-center items-center w-full">
                <div className="w-full max-w-[200px] aspect-square rounded-full border-4 border-gray-200 flex items-center justify-center bg-gray-50 relative shadow-inner">
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 bg-white shadow-sm flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Plaque</span>
                  </div>
                </div>
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
