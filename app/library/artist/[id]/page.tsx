import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { Metadata } from "next";
import ChartRow, { DisplayEntry, MaxStats } from "../../../components/ChartRow";
import ChartTrajectory from "../../../components/ChartTrajectory";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const { data: artist } = await supabase
    .from("artists")
    .select("name, image_url")
    .eq("id", resolvedParams.id)
    .single();

  if (!artist) {
    return { title: "Artist Not Found | Personal Hot 100" };
  }

  const pageTitle = `${artist.name} | Personal Hot 100`;
  const description = `View complete chart history, peak positions, and analytics for ${artist.name}.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: "profile",
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

export default async function ArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; albums?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const showAllTracks = resolvedSearchParams.view === "all";
  const showAllAlbums = resolvedSearchParams.albums === "all";

  const { data: liveWeek } = await supabase
    .from("chart_weeks")
    .select("id")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  const { data: artist, error } = await supabase
    .from("artists")
    .select(
      `
      *,
      albums ( id, title, cover_url, release_date ),
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

  if (error || !artist) {
    return <div className="p-10 font-bold text-red-500">Artist not found.</div>;
  }

  let careerTotalPoints = 0;
  let careerTotalUnits = 0;
  let no1Hits = 0;
  let top10Hits = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistTracks: any[] = [];
  const albums = artist.albums || [];

  const chartedSongs =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (artist.songs as any[])
      ?.map((song) => {
        const validEntries = (song.chart_entries || []).filter(
          (entry: any) => entry.week_id !== liveWeek?.id,
        );
        return { ...song, chart_entries: validEntries };
      })
      .filter((song) => song.chart_entries && song.chart_entries.length > 0) || [];
  const chartedSongsCount = chartedSongs.length;

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

    const seed = getStableSeed(
      song.display_title || song.title,
      artist.display_name || artist.name,
    );
    const songUnits = applyDeviation(
      Math.floor((songTotalStreams + songTotalSales + songTotalAirplay) * 1750 * 2),
      seed + 4,
    );

    careerTotalPoints += songTotalPoints;
    careerTotalUnits += songUnits;

    if (peakPos === 1) no1Hits++;
    if (peakPos <= 10) top10Hits++;

    artistTracks.push({
      id: song.id,
      title: song.display_title || song.title,
      debut: formatBillboardDate(debutDate),
      peak: peakPos,
      streak: highestStreakAtPeak,
      peakDate: formatBillboardDate(firstPeakDate),
      woc: woc,
    });
  });

  artistTracks.sort((a, b) => {
    if (b.woc !== a.woc) return b.woc - a.woc;
    if (a.peak !== b.peak) return a.peak - b.peak;
    return b.streak - a.streak;
  });

  const { data: allWeeksData } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .neq("id", liveWeek?.id)
    .order("start_date", { ascending: true });
  const allGlobalWeeks = allWeeksData?.map((w) => w.start_date) || [];

  const { data: rawArtistHistory } = await supabase
    .from("weekly_artist_stats")
    .select("*")
    .eq("id", resolvedParams.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validArtistHistory = (rawArtistHistory || []).filter(
    (e: any) => e.week_id !== liveWeek?.id,
  );
  validArtistHistory.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  let artistPeak = 101;
  let artistWoc = 0;
  let currentStreak = 0;
  let previousRank: number | null = null;
  const artistMaxStats: MaxStats = {
    sales: 0,
    streams: 0,
    airplay: 0,
    units: 0,
  };
  const artistSeed = getStableSeed(artist.name, "Artist");

  const enrichedArtistHistory = validArtistHistory.map((entry) => {
    artistWoc += 1;
    const rank = entry.rank;
    let isNewPeak = false;
    let isRePeak = false;

    if (rank < artistPeak) {
      artistPeak = rank;
      currentStreak = 1;
      isNewPeak = true;
    } else if (rank === artistPeak) {
      currentStreak += 1;
      if (previousRank !== artistPeak) isRePeak = true;
    }

    const weeklyStreams = applyDeviation(Math.floor(entry.streams * 5250 * 275), artistSeed + 1);
    const weeklySales = applyDeviation(Math.floor(entry.sales * 252), artistSeed + 2);
    const weeklyAirplay = applyDeviation(Math.floor(entry.airplay * 2250 * 5020), artistSeed + 3);
    const weeklyUnits = applyDeviation(
      Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
      artistSeed + 4,
    );

    if (weeklySales > artistMaxStats.sales) artistMaxStats.sales = weeklySales;
    if (weeklyStreams > artistMaxStats.streams) artistMaxStats.streams = weeklyStreams;
    if (weeklyAirplay > artistMaxStats.airplay) artistMaxStats.airplay = weeklyAirplay;
    if (weeklyUnits > artistMaxStats.units) artistMaxStats.units = weeklyUnits;

    const enriched = {
      ...entry,
      woc_at_time: artistWoc,
      peak_at_time: artistPeak,
      is_new_peak: isNewPeak,
      is_repeak: isRePeak,
      previous_position: previousRank,
      peak_streak: currentStreak > 0 ? currentStreak : null,
      chart_weeks: { start_date: entry.start_date },
    };

    previousRank = rank;
    return enriched;
  });

  const descendingArtistHistory = [...enrichedArtistHistory].reverse();

  const historyEntriesForList: DisplayEntry[] = descendingArtistHistory.map((entry) => ({
    id: entry.week_id,
    rank: entry.rank,
    previousRank: entry.previous_position,
    coverUrl: null,
    primaryText: artist.name,
    primaryHref: null,
    secondaryText: formatFullDate(entry.start_date),
    secondaryHref: `/charts/artists?week=${encodeURIComponent(entry.start_date)}`,
    mathSeedString: `${artist.name}|Artist`,
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

  const artistDebutDate =
    enrichedArtistHistory.length > 0 ? enrichedArtistHistory[0].start_date : null;
  const artistPeakEntry = enrichedArtistHistory.find((e) => e.rank === artistPeak);
  const artistFirstPeakDate = artistPeakEntry?.start_date;
  const artistHighestStreak = Math.max(
    0,
    ...enrichedArtistHistory.filter((e) => e.rank === artistPeak).map((e) => e.peak_streak || 0),
  );

  const displayedTracks = showAllTracks ? artistTracks : artistTracks.slice(0, 20);
  const displayedAlbums = showAllAlbums ? albums : albums.slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-24 text-gray-900">
      <div className="relative mb-12 aspect-[2400/933] max-h-[600px] min-h-[350px] w-full overflow-hidden bg-black shadow-sm">
        {artist.image_url ? (
          <img
            src={artist.image_url}
            alt={artist.name}
            className="absolute inset-0 h-full w-full object-cover object-[center_20%] opacity-90"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <span className="text-[15rem] leading-none font-black text-white uppercase opacity-5">
              {artist.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col justify-between px-10 py-10 md:px-0 md:py-12">
          <Link
            href="/charts/weekly"
            className="group inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold tracking-widest text-white uppercase drop-shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
          >
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
            Back to Hot 100
          </Link>

          <div>
            <p className="mb-2 text-sm font-bold tracking-widest text-white/80 uppercase drop-shadow-md">
              Artist Profile
            </p>
            <h1 className="mb-5 text-6xl leading-none font-black tracking-tighter text-white uppercase drop-shadow-xl md:text-8xl lg:text-[7rem]">
              {artist.name}
            </h1>

            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[11px] tracking-widest text-white/90 uppercase shadow-sm backdrop-blur-md">
              ID: {artist.id.split("-")[0]}
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
                {artistPeak === 101 ? "--" : artistPeak}
              </span>
              {artistHighestStreak > 0 && (
                <span
                  className="absolute top-4 right-4 rounded-sm px-2 py-0.5 text-[10px] font-black text-white uppercase"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {artistHighestStreak} Wks
                </span>
              )}
              <span className="z-10 mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                Career Peak Position
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {formatNumber(careerTotalPoints)}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                All-Time Career Points
              </span>
            </div>

            <div
              className="flex h-40 flex-col items-center justify-center border-2 bg-black"
              style={{ borderColor: ACCENT_COLOR }}
            >
              <span className="mb-1 text-6xl leading-none font-black tracking-tighter text-white">
                {artistWoc}
              </span>
              <span className="mt-2 w-3/4 border-t border-gray-700 pt-2 text-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                Weeks on Chart
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-4 shadow-sm">
              <span className="text-3xl font-black tracking-tighter text-[#B30000]">
                {formatNumber(careerTotalUnits)}
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Total Career Units
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
                {formatBillboardDate(artistDebutDate)}
              </span>
            </div>
            <div className="flex items-center justify-between border border-gray-200 bg-gray-100 p-4 px-8">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                First Peak Date
              </span>
              <span className="text-lg font-black text-gray-900">
                {formatBillboardDate(artistFirstPeakDate)}
              </span>
            </div>
          </div>
        </div>

        {albums.length > 0 && (
          <div className="mb-16">
            <div className="mb-4 bg-black p-4 text-white">
              <h2 className="text-xl font-black tracking-widest text-white uppercase">Albums</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {displayedAlbums.map(
                (al: {
                  id: string;
                  title: string;
                  cover_url: string | null;
                  release_date: string | null;
                }) => (
                  <Link
                    key={al.id}
                    href={`/library/album/${al.id}`}
                    className="group flex flex-col"
                  >
                    <div className="mb-2 aspect-square overflow-hidden border border-gray-300 bg-gray-200">
                      {al.cover_url ? (
                        <img
                          src={al.cover_url}
                          alt={al.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                          No Cover
                        </div>
                      )}
                    </div>
                    <span className="line-clamp-2 text-sm leading-tight font-bold transition-colors group-hover:text-[#B30000]">
                      {al.title}
                    </span>
                    {al.release_date && (
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(al.release_date).getFullYear()}
                      </span>
                    )}
                  </Link>
                ),
              )}
            </div>

            {!showAllAlbums && albums.length > 10 && (
              <div className="mt-6 flex justify-center">
                <Link
                  href={`/library/artist/${artist.id}?albums=all${showAllTracks ? "&view=all" : ""}`}
                  className="cursor-pointer border-2 border-black px-8 py-3 text-xs font-bold tracking-widest text-black uppercase transition-colors hover:bg-black hover:text-white"
                >
                  Show all
                </Link>
              </div>
            )}
          </div>
        )}

        {enrichedArtistHistory.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 bg-black p-4">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
                Chart Run
              </h2>
            </div>
            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 pt-8 shadow-sm">
              <ChartTrajectory
                songEntries={enrichedArtistHistory}
                allGlobalWeeks={allGlobalWeeks}
              />
            </div>
          </div>
        )}

        <div className="mb-16">
          <div className="mb-6 p-4" style={{ backgroundColor: ACCENT_COLOR }}>
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
                <ChartRow key={entry.id} entry={entry} week={entry.id} maxStats={artistMaxStats} />
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
          <div className="mb-4 flex items-end justify-between bg-black p-4 text-white">
            <h2 className="text-xl font-black tracking-widest text-white uppercase">
              Chart History
            </h2>
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
            {displayedTracks.length > 0 ? (
              displayedTracks.map((track, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <Link
                      href={`/library/song/${track.id}`}
                      className="inline-block text-xl leading-tight font-black transition-colors hover:text-[#B30000]"
                    >
                      {track.title}
                    </Link>
                    <div className="text-sm font-medium text-gray-500">{artist.name}</div>
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
                          style={{ backgroundColor: ACCENT_COLOR }}
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
                No charting tracks found for this artist.
              </div>
            )}
          </div>

          {!showAllTracks && artistTracks.length > 20 && (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/library/artist/${artist.id}?view=all${showAllAlbums ? "&albums=all" : ""}`}
                className="cursor-pointer border-2 border-black px-8 py-3 text-xs font-bold tracking-widest text-black uppercase transition-colors hover:bg-black hover:text-white"
              >
                Show all
              </Link>
            </div>
          )}
        </div>

        <div className="mb-16">
          <div className="mb-6 p-4" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              News & Feed
            </h2>
          </div>

          <div className="flex snap-x gap-6 overflow-x-auto pb-4">
            {artistTracks.slice(0, 4).map((track, i) => (
              <div
                key={i}
                className="group relative w-72 shrink-0 cursor-pointer snap-start bg-black shadow-md"
              >
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-800">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
                    />
                  ) : (
                    <span className="text-4xl font-black text-gray-700 uppercase">
                      {artist.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                  <div className="mb-1 text-xs font-bold" style={{ color: ACCENT_COLOR }}>
                    CHART UPDATE
                  </div>
                  <p className="line-clamp-3 text-sm leading-tight font-bold text-white">
                    “{track.title}” peaked at #{track.peak} and charted for {track.woc} weeks!
                  </p>
                </div>
              </div>
            ))}
            {artistTracks.length === 0 && (
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
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
            (Certifications pending...)
          </div>
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
