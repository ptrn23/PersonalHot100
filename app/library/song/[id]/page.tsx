import Link from "next/link";
import { Metadata } from "next";
import ChartRow from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";
import { DisplayEntry, MaxStats } from "@/types";
import { calculateDetailedUnits, calculateMaxStats } from "@/utils/metrics";
import { formatNumber, formatFullDate, formatShortDate, formatMilestone } from "@/utils/formatters";

import { getSongMetadata, getSongWithChartHistory } from "@/lib/db/songs";
import { getNewsByEntity } from "@/lib/db/news";
import { getCertificationsByEntity } from "@/lib/db/certifications";
import { getLatestChartWeek, getAllChartWeeks } from "@/lib/db/charts";

import {
  BadgeCheck,
  MoreHorizontal,
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Upload,
} from "lucide-react";
import { CASUAL_RED } from "@/config/theme";
import { CHART_NAME, CHART_HANDLE } from "@/config/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const song = await getSongMetadata(resolvedParams.id);

  if (!song) {
    return { title: `Song Not Found | ${CHART_NAME} Hot 100` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (song.artists as any)?.name || "Unknown Artist";
  const pageTitle = `${song.display_title || song.title} | ${CHART_NAME} Hot 100`;
  const description = `View chart performance, total points, and track history for "${song.display_title || song.title}" by ${artistName}.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: { title: pageTitle, description: description, type: "music.song" },
    twitter: { card: "summary_large_image", title: pageTitle, description: description },
  };
}

type CertificationData = {
  award_name: "Gold" | "Platinum" | "Diamond";
  multiplier: number;
  chart_weeks: { start_date: string };
};

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const [liveWeek, allWeeksData, song, rawSongNews, certs] = await Promise.all([
    getLatestChartWeek(),
    getAllChartWeeks(),
    getSongWithChartHistory(resolvedParams.id),
    getNewsByEntity("song", resolvedParams.id),
    getCertificationsByEntity("song_id", resolvedParams.id),
  ]);

  if (!song) {
    return <div className="p-10 font-bold text-red-500">Song not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const songNews = (rawSongNews as any[]).sort((a, b) => {
    const dateA = new Date(a.chart_weeks?.start_date || 0).getTime();
    const dateB = new Date(b.chart_weeks?.start_date || 0).getTime();
    return dateB - dateA;
  });

  const allGlobalWeeks = allWeeksData.map((w) => w.start_date);

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

  const mathSeedString = `${song.display_title || song.title}|${artistName}`;

  sortedEntries.forEach((entry) => {
    totalPoints += entry.total_points || 0;
    rawStreams += entry.streams || 0;
    rawSales += entry.sales || 0;
    rawAirplay += entry.airplay || 0;

    if (entry.peak_position < peakPos) peakPos = entry.peak_position;
    if (entry.weeks_on_chart > woc) woc = entry.weeks_on_chart;
  });

  const entriesWithSeeds = sortedEntries.map((entry) => ({
    streams: entry.streams || 0,
    sales: entry.sales || 0,
    airplay: entry.airplay || 0,
    mathSeedString: mathSeedString,
  }));

  const maxStats: MaxStats =
    entriesWithSeeds.length > 0
      ? calculateMaxStats(entriesWithSeeds)
      : { sales: 0, streams: 0, airplay: 0, units: 0 };

  const debutDate = sortedEntries.length > 0 ? sortedEntries[0].chart_weeks?.start_date : null;
  const peakEntry = sortedEntries.find((e) => e.rank === peakPos);
  const firstPeakDate = peakEntry?.chart_weeks?.start_date;
  highestStreak = Math.max(
    0,
    ...sortedEntries.filter((e) => e.rank === peakPos).map((e) => e.peak_streak || 0),
  );

  const { streamsUnits, salesUnits, airplayUnits, totalUnits } = calculateDetailedUnits(
    rawStreams,
    rawSales,
    rawAirplay,
    mathSeedString,
  );

  const allTimeStreams = streamsUnits;
  const allTimeSales = salesUnits;
  const allTimeAirplay = airplayUnits;
  const allTimeUnits = totalUnits;

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
    ? formatMilestone(getWeight(highestCert.award_name, highestCert.multiplier))
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
              style={{ borderColor: CASUAL_RED }}
            >
              <span className="z-10 mb-1 text-7xl leading-none font-black tracking-tighter text-white">
                {peakPos === 101 ? "--" : peakPos}
              </span>
              {highestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 rounded-sm px-2 py-0.5 text-[10px] font-black text-white uppercase"
                  style={{ backgroundColor: CASUAL_RED }}
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
              style={{ borderColor: CASUAL_RED }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {totalPoints}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                All-Time Points
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: CASUAL_RED }}
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
              <span className="text-lg font-black text-gray-900">{formatShortDate(debutDate)}</span>
            </div>
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatShortDate(firstPeakDate)}
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
          <div className="mb-6 p-4" style={{ backgroundColor: CASUAL_RED }}>
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
          <div className="mb-4 p-4" style={{ backgroundColor: CASUAL_RED }}>
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
                            {CHART_NAME} Hot 100
                          </span>

                          <BadgeCheck className="ml-1 h-5 w-5 shrink-0 fill-[#B30000] text-white" />

                          <span className="ml-1 truncate">@{CHART_HANDLE}</span>
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
                          <MoreHorizontal className="h-[18px] w-[18px]" />
                        </div>
                      </div>

                      <div className="mt-1 text-[15px] leading-normal text-gray-900">
                        <p>{news.headline}</p>
                        {news.subtext && <p className="mt-2">{news.subtext}</p>}
                      </div>

                      <div className="mt-3 flex w-full items-center justify-between text-gray-500">
                        <div className="flex w-full max-w-[400px] justify-between">
                          <div className="group flex items-center">
                            <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                              <MessageCircle className="h-[18px] w-[18px]" />
                            </div>
                          </div>
                          <div className="group flex items-center">
                            <div className="rounded-full p-2 transition-colors group-hover:bg-green-50 group-hover:text-green-500">
                              <Repeat2 className="h-[18px] w-[18px]" />
                            </div>
                          </div>
                          <div className="group flex items-center">
                            <div className="rounded-full p-2 transition-colors group-hover:bg-pink-50 group-hover:text-pink-500">
                              <Heart className="h-[18px] w-[18px]" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="rounded-full p-2 transition-colors hover:bg-blue-50 hover:text-blue-500">
                            <Bookmark className="h-[18px] w-[18px]" />
                          </div>
                          <div className="-mr-2 rounded-full p-2 transition-colors hover:bg-blue-50 hover:text-blue-500">
                            <Upload className="h-[18px] w-[18px]" />
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
                    <div className="text-lg font-black text-black">{certifiedUnits}</div>
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
