import { supabase } from "@/utils/supabase";
import { Metadata } from "next";
import Link from "next/link";
import ChartRow, { DisplayEntry, MaxStats } from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const { data: album } = await supabase
    .from("albums")
    .select(
      `
      title,
      cover_url,
      artists (name)
    `,
    )
    .eq("id", resolvedParams.id)
    .single();

  if (!album) {
    return { title: "Album Not Found | Personal Hot 100" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (album.artists as any)?.name || "Unknown Artist";
  const coverUrl = album.cover_url || "/default-cover.png";
  const pageTitle = `${album.title} | Personal Hot 100`;
  const description = `View chart performance, total points, and track history for the album '${album.title}' by ${artistName}.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: "music.album",
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

export default async function AlbumPage({
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

  const { data: allWeeksData } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .neq("id", liveWeek?.id)
    .order("start_date", { ascending: true });

  const allGlobalWeeks = allWeeksData?.map((w) => w.start_date) || [];
  const { data: album, error } = await supabase
    .from("albums")
    .select(
      `
      *,
      artists ( id, name ),
      songs (
        id,
        title,
        display_title,
        chart_entries (
          week_id,
          rank,
          total_points,
          streams,
          sales,
          airplay,
          peak_position,
          peak_streak,
          weeks_on_chart,
          chart_weeks ( start_date )
        )
      )
    `,
    )
    .eq("id", resolvedParams.id)
    .single();

  if (error || !album) {
    return <div className="p-10 font-bold text-red-500">Album not found.</div>;
  }

  const { data: certs } = await supabase
    .from("certifications")
    .select(`
      award_name,
      multiplier,
      chart_weeks ( start_date )
    `)
    .eq("album_id", resolvedParams.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistName = (album.artists as any)?.name || "Unknown Artist";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistId = (album.artists as any)?.id;
  const albumTitle = album.title;

  let eraTotalPoints = 0;
  let eraTotalUnits = 0;
  let no1Hits = 0;
  let top10Hits = 0;
  let chartedSongsCount = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumTracks: any[] = [];
  const chartedSongs =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (album.songs as any[])
      ?.map((song) => {
        const validEntries = (song.chart_entries || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entry: any) => entry.week_id !== liveWeek?.id,
        );
        return { ...song, chart_entries: validEntries };
      })
      .filter((song) => song.chart_entries && song.chart_entries.length > 0) ||
    [];
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
      ...sortedEntries
        .filter((e) => e.rank === peakPos)
        .map((e) => e.peak_streak || 0),
    );

    const seed = getStableSeed(song.display_title || song.title, artistName);
    const songUnits = applyDeviation(
      Math.floor(
        (songTotalStreams + songTotalSales + songTotalAirplay) * 1750 * 2,
      ),
      seed + 4,
    );

    eraTotalPoints += songTotalPoints;
    eraTotalUnits += songUnits;

    if (peakPos === 1) no1Hits++;
    if (peakPos <= 10) top10Hits++;

    albumTracks.push({
      id: song.id,
      title: song.display_title || song.title,
      debut: formatBillboardDate(debutDate),
      peak: peakPos,
      streak: highestStreakAtPeak,
      peakDate: formatBillboardDate(firstPeakDate),
      woc: woc,
      totalPoints: songTotalPoints,
    });
  });

  albumTracks.sort((a, b) => {
    if (b.woc !== a.woc) return b.woc - a.woc;
    if (a.peak !== b.peak) return a.peak - b.peak;
    return b.streak - a.streak;
  });

  const { data: rawAlbumHistory } = await supabase
    .from("weekly_album_stats")
    .select("*")
    .eq("id", resolvedParams.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validAlbumHistory = (rawAlbumHistory || []).filter(
    (e: any) => e.week_id !== liveWeek?.id,
  );
  validAlbumHistory.sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  let albumPeak = 101;
  let albumWoc = 0;
  let currentStreak = 0;
  let previousRank: number | null = null;
  const albumMaxStats: MaxStats = {
    sales: 0,
    streams: 0,
    airplay: 0,
    units: 0,
  };
  const albumSeed = getStableSeed(albumTitle, artistName);

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

    const weeklyStreams = applyDeviation(
      Math.floor(entry.streams * 5250 * 275),
      albumSeed + 1,
    );
    const weeklySales = applyDeviation(
      Math.floor(entry.sales * 252),
      albumSeed + 2,
    );
    const weeklyAirplay = applyDeviation(
      Math.floor(entry.airplay * 2250 * 5020),
      albumSeed + 3,
    );
    const weeklyUnits = applyDeviation(
      Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
      albumSeed + 4,
    );

    if (weeklySales > albumMaxStats.sales) albumMaxStats.sales = weeklySales;
    if (weeklyStreams > albumMaxStats.streams)
      albumMaxStats.streams = weeklyStreams;
    if (weeklyAirplay > albumMaxStats.airplay)
      albumMaxStats.airplay = weeklyAirplay;
    if (weeklyUnits > albumMaxStats.units) albumMaxStats.units = weeklyUnits;

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

  const historyEntriesForList: DisplayEntry[] = descendingAlbumHistory.map(
    (entry) => ({
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
    }),
  );

  const albumDebutDate =
    enrichedAlbumHistory.length > 0 ? enrichedAlbumHistory[0].start_date : null;
  const albumPeakEntry = enrichedAlbumHistory.find((e) => e.rank === albumPeak);
  const albumFirstPeakDate = albumPeakEntry?.start_date;
  const albumHighestStreak = Math.max(
    0,
    ...enrichedAlbumHistory
      .filter((e) => e.rank === albumPeak)
      .map((e) => e.peak_streak || 0),
  );

  const getWeight = (award: string, multi: number) => {
    if (award === "Diamond") return 10000000 * multi;
    if (award === "Platinum") return 1000000 * multi;
    if (award === "Gold") return 500000 * multi;
    return 0;
  };

  const sortedCerts = ((certs as unknown as {
    award_name: "Gold" | "Platinum" | "Diamond";
    multiplier: number;
    chart_weeks: { start_date: string };
  }[]) || []).sort(
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
            href="/charts/albums"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest mb-10 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Back to Top Albums 20
          </Link>

          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-64 h-64 shrink-0 bg-gray-100 shadow-xl border border-gray-200">
              {album.cover_url ? (
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-sm">
                  No Cover
                </div>
              )}
            </div>

            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">
                Album Profile
              </p>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                {album.title}
              </h1>
              <Link
                href={`/library/artist/${artistId}`}
                className="text-2xl font-bold text-gray-600 hover:text-blue-600 transition-colors inline-block"
              >
                By {artistName}
              </Link>
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
                {albumPeak === 101 ? "--" : albumPeak}
              </span>
              {albumHighestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {albumHighestStreak} Wks
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
                {formatNumber(eraTotalPoints)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-2">
                All-Time Era Points
              </span>
            </div>

            <div
              className="bg-black border-2 flex flex-col justify-center items-center h-40"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="text-white text-6xl font-black tracking-tighter leading-none mb-1">
                {albumWoc}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-2">
                Weeks on Chart
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-3xl font-black text-[#B30000] tracking-tighter">
                {formatNumber(eraTotalUnits)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Total Era Units
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {no1Hits}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                No. 1 Hits
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {top10Hits}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Top 10 Hits
              </span>
            </div>
            <div className="bg-white border border-gray-300 p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-2xl font-black text-gray-800 tracking-tighter">
                {chartedSongsCount}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1">
                Charted Songs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 border border-gray-200 p-4 flex justify-between items-center px-8">
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Debut Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(albumDebutDate)}
              </span>
            </div>
            <div className="bg-gray-100 border border-gray-200 p-4 flex justify-between items-center px-8">
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(albumFirstPeakDate)}
              </span>
            </div>
          </div>
        </div>

        {enrichedAlbumHistory.length > 0 && (
          <div className="mb-16">
            <div className="p-4 mb-6 bg-black">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                Chart Run
              </h2>
            </div>
            <div className="bg-white border-2 border-gray-200 shadow-sm rounded-lg p-6 pt-8">
              <ChartTrajectory
                songEntries={enrichedAlbumHistory}
                allGlobalWeeks={allGlobalWeeks}
              />
            </div>
          </div>
        )}

        <div className="mb-16">
          <div className="p-4 mb-6" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Week-by-Week History
            </h2>
          </div>

          <div className="text-sm border-t-2 border-black shadow-sm bg-white overflow-hidden">
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
                  maxStats={albumMaxStats}
                />
              ))}
              {historyEntriesForList.length === 0 && (
                <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                  No Top 20 history found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="bg-black text-white p-4 flex justify-end items-end mb-4">
            <div className="hidden md:flex gap-12 pr-6 text-center text-xs font-black uppercase leading-tight tracking-wide text-white">
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
                <div
                  key={i}
                  className="bg-white p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex-1">
                    <Link
                      href={`/library/song/${track.id}`}
                      className="font-black text-xl leading-tight hover:text-[#B30000] transition-colors inline-block"
                    >
                      {track.title}
                    </Link>
                    <div className="text-gray-500 text-sm font-medium">
                      {artistName}
                    </div>
                  </div>

                  <div className="hidden md:flex gap-12 pr-6 text-center items-center">
                    <div className="w-16 text-sm font-bold border-b-2 border-black pb-0.5">
                      {track.debut}
                    </div>

                    <div className="w-12 flex flex-col items-center">
                      <span className="text-2xl font-black leading-none">
                        {track.peak}
                      </span>
                      {track.streak > 0 && (
                        <span
                          className="text-white text-[9px] font-black uppercase px-1 mt-0.5"
                          style={{ backgroundColor: ACCENT_COLOR }}
                        >
                          {track.streak} Wks
                        </span>
                      )}
                    </div>

                    <div className="w-16 text-sm font-bold border-b-2 border-black pb-0.5">
                      {track.peakDate}
                    </div>
                    <div className="w-16 text-2xl font-black">{track.woc}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm shadow-sm">
                No charting tracks found for this era.
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              News & Feed
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
            {albumTracks.slice(0, 4).map((track, i) => (
              <div
                key={i}
                className="shrink-0 w-72 bg-black relative group snap-start cursor-pointer shadow-md"
              >
                <div className="aspect-[4/3] bg-gray-800 overflow-hidden">
                  {album.cover_url && (
                    <img
                      src={album.cover_url}
                      alt="News Thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div
                    className="text-xs font-bold mb-1"
                    style={{ color: ACCENT_COLOR }}
                  >
                    CHART UPDATE
                  </div>
                  <p className="text-white font-bold text-sm leading-tight line-clamp-3">
                    “{track.title}” peaked at #{track.peak} and charted for{" "}
                    {track.woc} weeks!
                  </p>
                </div>
              </div>
            ))}
            {albumTracks.length === 0 && (
              <div className="w-full text-center text-gray-400 font-bold uppercase py-10">
                No news available.
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
                    <div className="text-lg font-medium text-gray-900">Album</div> {/* 🚨 Updated to Album */}
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
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
            (Records pending...)
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