import { supabase } from "@/utils/supabase";
import Link from "next/link";

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

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { data: album, error } = await supabase
    .from("albums")
    .select(`
      *,
      artists ( id, name ),
      songs (
        id,
        title,
        chart_entries (
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
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (error || !album) {
    return <div className="p-10 font-bold text-red-500">Album not found.</div>;
  }

  const artistName = (album.artists as any)?.name || "Unknown Artist";
  const artistId = (album.artists as any)?.id;

  let eraTotalPoints = 0;
  let eraTotalUnits = 0;
  let no1Hits = 0;
  let top10Hits = 0;
  let chartedSongsCount = 0;

  const albumTracks: any[] = [];

  const chartedSongs = (album.songs as any[])?.filter((song) => song.chart_entries && song.chart_entries.length > 0) || [];
  chartedSongsCount = chartedSongs.length;

  chartedSongs.forEach((song) => {
    let songTotalPoints = 0;
    let songTotalStreams = 0;
    let songTotalSales = 0;
    let songTotalAirplay = 0;
    let peakPos = 101;
    let woc = 0;

    const sortedEntries = [...song.chart_entries].sort((a, b) => 
      new Date(a.chart_weeks?.start_date).getTime() - new Date(b.chart_weeks?.start_date).getTime()
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
    const highestStreakAtPeak = Math.max(...sortedEntries.filter((e) => e.rank === peakPos).map((e) => e.peak_streak || 0));

    const seed = getStableSeed(song.title, artistName);
    const songUnits = applyDeviation(Math.floor((songTotalStreams + songTotalSales + songTotalAirplay) * 1750 * 2), seed + 4);

    eraTotalPoints += songTotalPoints;
    eraTotalUnits += songUnits;

    if (peakPos === 1) no1Hits++;
    if (peakPos <= 10) top10Hits++;

    albumTracks.push({
      title: song.title,
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

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pb-24">
      <div className="bg-white p-10 pb-12 shadow-sm mb-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest mb-10 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Back to Hot 100
          </Link>

          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-64 h-64 shrink-0 bg-gray-100 shadow-xl border border-gray-200">
              {album.cover_url ? (
                <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-sm">No Cover</div>
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
                href={`/artist/${artistId}`}
                className="text-2xl font-bold text-gray-600 hover:text-blue-600 transition-colors inline-block"
              >
                By {artistName}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 md:px-0">
        <div className="flex flex-wrap gap-4 mb-16 justify-center">
          <div className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32" style={{ borderColor: ACCENT_COLOR }}>
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {formatNumber(eraTotalPoints)}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Total Points
            </span>
          </div>

          <div className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32" style={{ borderColor: ACCENT_COLOR }}>
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {formatNumber(eraTotalUnits)}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Total Units
            </span>
          </div>

          <div className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32" style={{ borderColor: ACCENT_COLOR }}>
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {no1Hits}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              No. 1 Hits
            </span>
          </div>
          
          <div className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32" style={{ borderColor: ACCENT_COLOR }}>
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {top10Hits}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Top 10 Hits
            </span>
          </div>
          
          <div className="bg-black border-2 flex flex-col justify-center items-center w-40 h-32" style={{ borderColor: ACCENT_COLOR }}>
            <span className="text-white text-4xl font-black tracking-tighter leading-none mb-1">
              {chartedSongsCount}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 border-t border-gray-700 w-3/4 text-center pt-2 mt-1">
              Songs
            </span>
          </div>
        </div>

        <div className="mb-16">
          <div className="bg-black text-white p-4 flex justify-end items-end mb-4">
            <div className="hidden md:flex gap-12 pr-6 text-center text-xs font-black uppercase leading-tight tracking-wide text-white">
              <div className="w-16">Debut<br/>Date</div>
              <div className="w-12">Peak<br/>Pos.</div>
              <div className="w-16">Peak<br/>Date</div>
              <div className="w-16">Wks. On<br/>Chart</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {albumTracks.length > 0 ? (
              albumTracks.map((track, i) => (
                <div key={i} className="bg-white p-4 flex items-center justify-between shadow-sm">
                  <div className="flex-1">
                    <div className="font-black text-xl leading-tight">{track.title}</div>
                    <div className="text-gray-500 text-sm font-medium">{artistName}</div>
                  </div>
                  
                  <div className="hidden md:flex gap-12 pr-6 text-center items-center">
                    <div className="w-16 text-sm font-bold border-b-2 border-black pb-0.5">{track.debut}</div>
                    
                    <div className="w-12 flex flex-col items-center">
                      <span className="text-2xl font-black leading-none">{track.peak}</span>
                      {track.streak > 0 && (
                        <span className="text-white text-[9px] font-black uppercase px-1 mt-0.5" style={{ backgroundColor: ACCENT_COLOR }}>
                          {track.streak} Wks
                        </span>
                      )}
                    </div>
                    
                    <div className="w-16 text-sm font-bold border-b-2 border-black pb-0.5">{track.peakDate}</div>
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
               <div key={i} className="shrink-0 w-72 bg-black relative group snap-start cursor-pointer shadow-md">
                 <div className="aspect-[4/3] bg-gray-800 overflow-hidden">
                    {album.cover_url && (
                      <img src={album.cover_url} alt="News Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    )}
                 </div>
                 <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="text-xs font-bold mb-1" style={{ color: ACCENT_COLOR }}>CHART UPDATE</div>
                    <p className="text-white font-bold text-sm leading-tight line-clamp-3">
                       “{track.title}” peaked at #{track.peak} and charted for {track.woc} weeks!
                    </p>
                 </div>
               </div>
             ))}
             {albumTracks.length === 0 && (
                <div className="w-full text-center text-gray-400 font-bold uppercase py-10">No news available.</div>
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
