import Link from "next/link";
import { getLatestChartWeek, getChartEntriesByWeekId, getAllChartWeeks } from "@/lib/db/charts";
import { Play, Shuffle, ArrowDownToLine, MoreHorizontal, Calendar } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";
import { calculateUnits, calculateDetailedUnits } from "@/utils/metrics";

export default async function StreamifyPage() {
  const allWeeks = await getAllChartWeeks();
  const targetWeek = allWeeks[1] || allWeeks[0];
  
  if (!targetWeek) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <div className="flex h-[50vh] items-center justify-center font-bold">No completed chart week found.</div>
      </div>
    );
  }

  const rawEntries = await getChartEntriesByWeekId(targetWeek.id, 50);

  const streamifyEntries = [...rawEntries].sort((a, b) => {
    const titleA = a.songs?.display_title || a.songs?.title || "";
    const artistA = a.songs?.artists?.name || "";
    const titleB = b.songs?.display_title || b.songs?.title || "";
    const artistB = b.songs?.artists?.name || "";

    const unitsA = calculateUnits(a.streams || 0, a.sales || 0, a.airplay || 0, titleA, artistA);
    const unitsB = calculateUnits(b.streams || 0, b.sales || 0, b.airplay || 0, titleB, artistB);
    
    return unitsB - unitsA;
  });

  const formattedDateRange = formatDateRange(targetWeek.start_date, targetWeek.end_date);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-geist selection:bg-[#1db954] selection:text-black">
      {/* SPOTIFY-STYLE HERO BANNER */}
      <div className="relative w-full bg-gradient-to-b from-[#1ed760]/30 via-[#121212]/80 to-[#121212] px-8 pt-12 pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row items-end gap-8">
          
          <div className="flex h-52 w-52 shrink-0 items-center justify-center border-4 border-black bg-[#1ed760] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-black">
              <span className="text-xs font-black tracking-[0.2em] uppercase">Streamify</span>
              <span className="text-4xl font-black tracking-tighter uppercase">Top 50</span>
              <span className="text-[10px] font-bold tracking-widest uppercase mt-2">Global</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-black tracking-widest text-[#1ed760] uppercase">
              Verified Playlist
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white">
              Top Songs - Global
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
              Your weekly update of the most played tracks right now - Global.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 mt-2">
              <span className="text-white font-black">So Casual Charts</span>
              <span>•</span>
              <span>{streamifyEntries.length} songs</span>
              <span>•</span>
              <span className="text-gray-400">{formattedDateRange}</span>
            </div>
          </div>

        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="mx-auto max-w-[1400px] px-8 py-6">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-6">
          <div className="flex items-center gap-6">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-lg transition-transform hover:scale-105 hover:bg-[#1db954]">
              <Play size={24} fill="black" className="ml-1" />
            </button>
            <button className="text-gray-400 transition-colors hover:text-white"><Shuffle size={22} /></button>
            <button className="text-gray-400 transition-colors hover:text-white"><ArrowDownToLine size={22} /></button>
            <button className="text-gray-400 transition-colors hover:text-white"><MoreHorizontal size={22} /></button>
          </div>
        </div>

        {/* TRACK LIST TABLE */}
        <div className="mt-6 w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 text-right">Streams</th>
                <th className="py-3 px-4">Album</th>
                <th className="py-3 px-4 w-20 text-center">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50 text-sm font-bold">
                {streamifyEntries.map((entry, index) => {
                const song = entry.songs;
                const title = song?.display_title || song?.title || "Unknown Title";
                const artistName = song?.artists?.name || "Unknown Artist";
                const albumTitle = song?.albums?.title || "Unknown Album";
                const coverUrl = song?.albums?.cover_url;
                const rank = index + 1;
                
                const seedString = `${title}|${artistName}`;
                const units = calculateDetailedUnits(
                    entry.streams || 0,
                    entry.sales || 0,
                    entry.airplay || 0,
                    seedString
                );

                return (
                    <tr key={entry.id} className="group transition-colors hover:bg-zinc-900/80">
                    <td className="py-3 px-4 text-center font-mono text-gray-400 group-hover:text-white">
                        {rank}
                    </td>

                    <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 bg-zinc-800 overflow-hidden border border-zinc-700">
                            {coverUrl ? (
                            <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
                            ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">IMG</div>
                            )}
                        </div>
                        <div className="flex flex-col truncate">
                            <Link href={`/library/song/${song?.id}`} className="truncate text-white font-bold transition-colors hover:text-[#1ed760] hover:underline">
                            {title}
                            </Link>
                            <span className="truncate text-xs font-medium text-gray-400">
                            {artistName}
                            </span>
                        </div>
                        </div>
                    </td>

                    {/* 2. Display the calculated streams units instead of raw counts, or show both! */}
                    <td className="py-3 px-4 text-right font-mono text-[#1ed760] font-black tracking-wider">
                        {units.streamsUnits.toLocaleString("en-US")}
                    </td>

                    <td className="py-3 px-4 text-gray-400 font-medium truncate max-w-xs">
                        <Link href={`/library/album/${song?.albums?.id}`} className="hover:underline hover:text-white truncate">
                        {albumTitle}
                        </Link>
                    </td>

                    <td className="py-3 px-4 text-center text-xs font-mono text-gray-500">
                        --
                    </td>
                    </tr>
                );
                })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
