import { Metadata } from "next";
import Link from "next/link";
import ChartRow from "../../../components/ChartRow";
import { DisplayEntry } from "@/types";
import { calculateDetailedUnits, calculateMaxStats } from "@/utils/metrics";
import ChartTrajectory from "../../../components/ChartTrajectory";
import { User, ArrowLeft } from "lucide-react";

import { CASUAL_RED, CASUAL_BLACK, CASUAL_WHITE } from "@/config/theme";
import { CHART_NAME } from "@/config/constants";
import { formatNumber, formatFullDate, formatShortDate, formatMilestone } from "@/utils/formatters";

import { getAlbumMetadata, getAlbumWithSongHistory, getAlbumChartHistory } from "@/lib/db/albums";
import { getCertificationsByEntity } from "@/lib/db/certifications";
import { getLatestChartWeek, getAllChartWeeks } from "@/lib/db/charts";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const album = await getAlbumMetadata(resolvedParams.id);

  if (!album) {
    return { title: `Album Not Found | ${CHART_NAME} Hot 100` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (album.artists as any)?.name || "Unknown Artist";
  const pageTitle = `${album.title} | ${CHART_NAME} Hot 100`;
  const description = `View chart performance, total points, and track history for the album '${album.title}' by ${artistName}.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: { title: pageTitle, description: description, type: "music.album" },
    twitter: { card: "summary_large_image", title: pageTitle, description: description },
  };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [liveWeek, allWeeksData, album, rawAlbumHistory, certs] = await Promise.all([
    getLatestChartWeek(),
    getAllChartWeeks(),
    getAlbumWithSongHistory(resolvedParams.id),
    getAlbumChartHistory(resolvedParams.id),
    getCertificationsByEntity("album_id", resolvedParams.id),
  ]);

  if (!album) {
    return <div className="p-10 font-bold text-red-500">Album not found.</div>;
  }

  const allGlobalWeeks = allWeeksData.map((w) => w.start_date) || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (album.artists as any)?.name || "Unknown Artist";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistId = (album.artists as any)?.id;
  const albumTitle = album.title;

  let eraTotalPoints = 0;
  let eraRawStreams = 0;
  let eraRawSales = 0;
  let eraRawAirplay = 0;

  let no1Hits = 0;
  let top10Hits = 0;
  let chartedSongsCount = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumTracks: any[] = [];
  const chartedSongs =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (album.songs as any[])
      ?.map((song) => {
        const validEntries = song.chart_entries || [];
        return { ...song, chart_entries: validEntries };
      })
      .filter((song) => song.chart_entries && song.chart_entries.length > 0) || [];

  chartedSongsCount = chartedSongs.length;

  chartedSongs.forEach((song) => {
    let songTotalPoints = 0;
    let songTotalStreams = 0;
    let songTotalSales = 0;
    let songTotalAirplay = 0;
    let peakPos = 101;
    let woc = 0;

    const sortedEntries = [...song.chart_entries].sort(
      (a, b) =>
        new Date(a.chart_weeks?.start_date).getTime() -
        new Date(b.chart_weeks?.start_date).getTime(),
    );

    sortedEntries.forEach((entry) => {
      songTotalPoints += entry.total_points || 0;
      songTotalStreams += entry.streams || 0;
      songTotalSales += entry.sales || 0;
      songTotalAirplay += entry.airplay || 0;

      if (entry.peak_position < peakPos) peakPos = entry.peak_position;
      if (entry.weeks_on_chart > woc) woc = entry.weeks_on_chart;
    });

    const debutDate = sortedEntries[0]?.chart_weeks?.start_date;
    const peakEntry = sortedEntries.find((e) => e.rank === peakPos);
    const firstPeakDate = peakEntry?.chart_weeks?.start_date;
    const highestStreakAtPeak = Math.max(
      ...sortedEntries.filter((e) => e.rank === peakPos).map((e) => e.peak_streak || 0),
    );

    const mathSeedString = `${song.display_title || song.title}|${artistName}`;
    const { totalUnits } = calculateDetailedUnits(
      songTotalStreams,
      songTotalSales,
      songTotalAirplay,
      mathSeedString,
    );

    eraTotalPoints += songTotalPoints;
    eraRawStreams += songTotalStreams;
    eraRawSales += songTotalSales;
    eraRawAirplay += songTotalAirplay;

    if (peakPos === 1) no1Hits++;
    if (peakPos <= 10) top10Hits++;

    albumTracks.push({
      id: song.id,
      title: song.display_title || song.title,
      debut: formatShortDate(debutDate),
      peak: peakPos,
      streak: highestStreakAtPeak,
      peakDate: formatShortDate(firstPeakDate),
      woc: woc,
      totalPoints: songTotalPoints,
    });
  });

  const albumMathSeed = `${albumTitle}|${artistName}`;

  const { totalUnits: eraTotalUnits } = calculateDetailedUnits(
    eraRawStreams,
    eraRawSales,
    eraRawAirplay,
    albumMathSeed,
  );

  albumTracks.sort((a, b) => {
    if (b.woc !== a.woc) return b.woc - a.woc;
    if (a.peak !== b.peak) return a.peak - b.peak;
    return b.streak - a.streak;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validAlbumHistory = rawAlbumHistory || [];
  validAlbumHistory.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  let albumPeak = 101;
  let albumWoc = 0;
  let currentStreak = 0;
  let previousRank: number | null = null;

  const enrichedAlbumHistory = validAlbumHistory.map((entry) => {
    albumWoc += 1;
    const rank = entry.rank;
    let isNewPeak = false;
    let isRePeak = false;

    if (rank < albumPeak) {
      albumPeak = rank;
      currentStreak = 1;
      isNewPeak = true;
    } else if (rank === albumPeak) {
      currentStreak += 1;
      if (previousRank !== albumPeak) isRePeak = true;
    }

    const enriched = {
      ...entry,
      woc_at_time: albumWoc,
      peak_at_time: albumPeak,
      is_new_peak: isNewPeak,
      is_repeak: isRePeak,
      previous_position: previousRank,
      peak_streak: currentStreak > 0 ? currentStreak : null,
      chart_weeks: { start_date: entry.start_date },
    };

    previousRank = rank;
    return enriched;
  });

  const descendingAlbumHistory = [...enrichedAlbumHistory].reverse();

  const historyEntriesForList: DisplayEntry[] = descendingAlbumHistory.map((entry) => ({
    id: entry.week_id,
    rank: entry.rank,
    previousRank: entry.previous_position,

    coverUrl: album.cover_url,
    primaryText: albumTitle,
    primaryHref: null,
    secondaryText: formatFullDate(entry.start_date),
    secondaryHref: `/charts/albums?week=${encodeURIComponent(entry.start_date)}`,

    mathSeedString: `${albumTitle}|${artistName}`,

    disableDropdown: true,
    hideRankChange: false,

    isNewPeak: entry.is_new_peak,
    isRePeak: entry.is_repeak,
    peakPosition: entry.peak_at_time,
    peakStreak: entry.peak_streak,
    weeksOnChart: entry.woc_at_time,
    totalPoints: entry.total_points || 0,
    currentWeekPoints: entry.current_week_points || 0,
    previousWeekRawPoints: null,
    twoWeeksAgoRawPoints: null,
    sales: entry.sales || 0,
    streams: entry.streams || 0,
    airplay: entry.airplay || 0,
  }));

  const albumMaxStats =
    historyEntriesForList.length > 0
      ? calculateMaxStats(historyEntriesForList)
      : { sales: 0, streams: 0, airplay: 0, units: 0 };

  const albumDebutDate =
    enrichedAlbumHistory.length > 0 ? enrichedAlbumHistory[0].start_date : null;
  const albumPeakEntry = enrichedAlbumHistory.find((e) => e.rank === albumPeak);
  const albumFirstPeakDate = albumPeakEntry?.start_date;
  const albumHighestStreak = Math.max(
    0,
    ...enrichedAlbumHistory.filter((e) => e.rank === albumPeak).map((e) => e.peak_streak || 0),
  );

  const getWeight = (award: string, multi: number) => {
    if (award === "Diamond") return 10000000 * multi;
    if (award === "Platinum") return 1000000 * multi;
    if (award === "Gold") return 500000 * multi;
    return 0;
  };

  const sortedCerts = (
    (certs as unknown as {
      award_name: "Gold" | "Platinum" | "Diamond";
      multiplier: number;
      chart_weeks: { start_date: string };
    }[]) || []
  ).sort((a, b) => getWeight(b.award_name, b.multiplier) - getWeight(a.award_name, a.multiplier));

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
            href="/charts/albums"
            className="group mb-10 inline-flex items-center gap-2 text-sm font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-black"
          >
            <ArrowLeft size={16} strokeWidth={3} className="transition-transform group-hover:-translate-x-1" />
            Back to Top Albums 20
          </Link>

          <div className="flex flex-col items-end gap-10 md:flex-row">
            <div className="h-64 w-64 shrink-0 border border-gray-200 bg-gray-100 shadow-xl">
              {album.cover_url ? (
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400 uppercase">
                  No Cover
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-bold tracking-widest text-gray-500 uppercase">
                Album Profile
              </p>
              <h1 className="mb-4 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
                {album.title}
              </h1>
              <Link
                href={`/library/artist/${artistId}`}
                className="inline-flex items-center gap-2 text-2xl font-bold text-gray-600 transition-colors hover:text-blue-600"
              >
                <User size={22} strokeWidth={2.5} />
                {artistName}
              </Link>
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
                {albumPeak === 101 ? "--" : albumPeak}
              </span>
              {albumHighestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 rounded-sm px-2 py-0.5 text-[10px] font-black text-white uppercase"
                  style={{ backgroundColor: CASUAL_RED }}
                >
                  {albumHighestStreak} Wks
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
                {eraTotalPoints}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                All-Time Era Points
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: CASUAL_RED }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {albumWoc}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                Weeks on Chart
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-3xl font-black tracking-tighter text-[#B30000]">
                {formatNumber(eraTotalUnits)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Total Era Units
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">{no1Hits}</span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                No. 1 Hits
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">
                {top10Hits}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Top 10 Hits
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-2xl font-black tracking-tighter text-gray-800">
                {chartedSongsCount}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Charted Songs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Debut Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatShortDate(albumDebutDate)}
              </span>
            </div>
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatShortDate(albumFirstPeakDate)}
              </span>
            </div>
          </div>
        </div>

        {enrichedAlbumHistory.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 bg-black p-4">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
                Chart Run
              </h2>
            </div>
            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 pt-8 shadow-sm">
              <ChartTrajectory songEntries={enrichedAlbumHistory} allGlobalWeeks={allGlobalWeeks} maxRank={20} />
            </div>
          </div>
        )}

        <div className="mb-16">
          <div className="mb-6 p-4" style={{ backgroundColor: CASUAL_RED }}>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              Week-by-Week History
            </h2>
          </div>

          <div className="overflow-hidden border-t-2 border-black bg-white text-sm shadow-sm">
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
                <ChartRow key={entry.id} entry={entry} week={entry.id} maxStats={albumMaxStats} />
              ))}
              {historyEntriesForList.length === 0 && (
                <div className="p-10 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
                  No Top 20 history found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-4 flex items-end justify-end bg-black p-4 text-white">
            <div className="hidden gap-12 pr-6 text-center text-xs leading-tight font-black tracking-wide text-white uppercase md:flex">
              <div className="w-16">
                Debut
                <br />
                Date
              </div>
              <div className="w-12">
                Peak
                <br />
                Pos.
              </div>
              <div className="w-16">
                Peak
                <br />
                Date
              </div>
              <div className="w-16">
                Wks. On
                <br />
                Chart
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {albumTracks.length > 0 ? (
              albumTracks.map((track, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <Link
                      href={`/library/song/${track.id}`}
                      className="inline-block text-xl leading-tight font-black transition-colors hover:text-[#B30000]"
                    >
                      {track.title}
                    </Link>
                    <div className="text-sm font-medium text-gray-500">{artistName}</div>
                  </div>

                  <div className="hidden items-center gap-12 pr-6 text-center md:flex">
                    <div className="w-16 border-b-2 border-black pb-0.5 text-sm font-bold">
                      {track.debut}
                    </div>

                    <div className="flex w-12 flex-col items-center">
                      <span className="text-2xl leading-none font-black">{track.peak}</span>
                      {track.streak > 0 && (
                        <span
                          className="mt-0.5 px-1 text-[9px] font-black text-white uppercase"
                          style={{ backgroundColor: CASUAL_RED }}
                        >
                          {track.streak} Wks
                        </span>
                      )}
                    </div>

                    <div className="w-16 border-b-2 border-black pb-0.5 text-sm font-bold">
                      {track.peakDate}
                    </div>
                    <div className="w-16 text-2xl font-black">{track.woc}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center text-sm font-bold tracking-widest text-gray-400 uppercase shadow-sm">
                No charting tracks found for this era.
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          <div className="mb-6 p-4" style={{ backgroundColor: CASUAL_RED }}>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              News & Feed
            </h2>
          </div>

          <div className="flex snap-x gap-6 overflow-x-auto pb-4">
            {albumTracks.slice(0, 4).map((track, i) => (
              <div
                key={i}
                className="group relative w-72 shrink-0 cursor-pointer snap-start bg-black shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-800">
                  {album.cover_url && (
                    <img
                      src={album.cover_url}
                      alt="News Thumbnail"
                      className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                  <div className="mb-1 text-xs font-bold" style={{ color: CASUAL_RED }}>
                    CHART UPDATE
                  </div>
                  <p className="line-clamp-3 text-sm leading-tight font-bold text-white">
                    “{track.title}” peaked at #{track.peak} and charted for {track.woc} weeks!
                  </p>
                </div>
              </div>
            ))}
            {albumTracks.length === 0 && (
              <div className="w-full py-10 text-center font-bold text-gray-400 uppercase">
                No news available.
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
                    <div className="text-lg font-medium text-gray-900">Album</div>{" "}
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
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
            (Records pending...)
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
