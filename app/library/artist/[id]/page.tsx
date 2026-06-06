import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { Metadata } from "next";

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
      .filter((song) => song.chart_entries && song.chart_entries.length > 0) ||
    [];
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
      ...sortedEntries
        .filter((e) => e.rank === peakPos)
        .map((e) => e.peak_streak || 0),
    );

    const seed = getStableSeed(
      song.display_title || song.title,
      artist.display_name || artist.name,
    );
    const songUnits = applyDeviation(
      Math.floor(
        (songTotalStreams + songTotalSales + songTotalAirplay) * 1750 * 2,
      ),
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

  const displayedTracks = showAllTracks
    ? artistTracks
    : artistTracks.slice(0, 20);
  const displayedAlbums = showAllAlbums ? albums : albums.slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pb-24">
      <div className="relative w-full aspect-[2400/933] min-h-[350px] max-h-[600px] bg-black overflow-hidden mb-12 shadow-sm">
        {artist.image_url ? (
          <img
            src={artist.image_url}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-90"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <span className="text-white text-[15rem] font-black uppercase opacity-5 leading-none">
              {artist.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 w-full h-full max-w-5xl mx-auto px-10 md:px-0 flex flex-col justify-between py-10 md:py-12">
          <Link
            href="/charts/weekly"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/20 hover:scale-105 transition-all group drop-shadow-md w-max"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Back to Hot 100
          </Link>

          <div>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm mb-2 drop-shadow-md">
              Artist Profile
            </p>
            <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black uppercase tracking-tighter leading-none mb-5 text-white drop-shadow-xl">
              {artist.name}
            </h1>

            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-mono text-white/90 uppercase tracking-widest shadow-sm">
              ID: {artist.id.split("-")[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 md:px-0">
        <div className="flex flex-wrap gap-4 mb-16 justify-center">
          <div
            className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32"
            style={{ borderColor: ACCENT_COLOR }}
          >
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {formatNumber(careerTotalPoints)}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Total Points
            </span>
          </div>

          <div
            className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32"
            style={{ borderColor: ACCENT_COLOR }}
          >
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {formatNumber(careerTotalUnits)}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Total Units
            </span>
          </div>

          <div
            className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32"
            style={{ borderColor: ACCENT_COLOR }}
          >
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {no1Hits}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              No. 1 Hits
            </span>
          </div>

          <div
            className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32"
            style={{ borderColor: ACCENT_COLOR }}
          >
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {top10Hits}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Top 10 Hits
            </span>
          </div>

          <div
            className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32"
            style={{ borderColor: ACCENT_COLOR }}
          >
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {chartedSongsCount}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Songs
            </span>
          </div>
        </div>

        {albums.length > 0 && (
          <div className="mb-16">
            <div className="bg-black text-white p-4 mb-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">
                Albums
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    <div className="aspect-square bg-gray-200 mb-2 overflow-hidden border border-gray-300">
                      {al.cover_url ? (
                        <img
                          src={al.cover_url}
                          alt={al.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-[10px]">
                          No Cover
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm leading-tight group-hover:text-[#B30000] transition-colors line-clamp-2">
                      {al.title}
                    </span>
                    {al.release_date && (
                      <span className="text-xs text-gray-500 font-medium">
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
                  className="border-2 border-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Show all
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mb-16">
          <div className="bg-black text-white p-4 flex justify-between items-end mb-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-white">
              Chart History
            </h2>
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
            {displayedTracks.length > 0 ? (
              displayedTracks.map((track, i) => (
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
                      {artist.name}
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
                No charting tracks found for this artist.
              </div>
            )}
          </div>

          {!showAllTracks && artistTracks.length > 20 && (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/library/artist/${artist.id}?view=all${showAllAlbums ? "&albums=all" : ""}`}
                className="border-2 border-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                Show all
              </Link>
            </div>
          )}
        </div>

        <div className="mb-16">
          <div className="p-4 mb-6" style={{ backgroundColor: ACCENT_COLOR }}>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              News & Feed
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
            {artistTracks.slice(0, 4).map((track, i) => (
              <div
                key={i}
                className="shrink-0 w-72 bg-black relative group snap-start cursor-pointer shadow-md"
              >
                <div className="aspect-[4/3] bg-gray-800 overflow-hidden flex items-center justify-center">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
                    />
                  ) : (
                    <span className="text-gray-700 text-4xl font-black uppercase">
                      {artist.name.charAt(0)}
                    </span>
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
            {artistTracks.length === 0 && (
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
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
            (Certifications pending...)
          </div>
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
