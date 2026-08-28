import Link from "next/link";
import { getChartEntriesByWeekId, getAllChartWeeks } from "@/lib/db/charts";
import { Play, Shuffle, ArrowDownToLine, MoreHorizontal, Calendar } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import WeekSelector from "../../components/WeekSelector";

type StreamifyPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function StreamifyPage({ searchParams }: StreamifyPageProps) {
  const resolvedParams = await searchParams;
  const selectedWeekStr = resolvedParams?.week;

  const allWeeks = await getAllChartWeeks();

  const historicalWeeks = allWeeks.filter((w, idx) => idx > 0);

  let targetWeek = historicalWeeks.find((w) => w.start_date === selectedWeekStr);
  if (!targetWeek) {
    targetWeek = historicalWeeks[0] || allWeeks[0];
  }

  if (!targetWeek) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <div className="flex h-[50vh] items-center justify-center font-bold">
          No completed chart week found.
        </div>
      </div>
    );
  }

  const rawEntries = await getChartEntriesByWeekId(targetWeek.id, 50);

  const streamifyEntries = rawEntries.map((entry) => {
    const song = entry.songs;
    const title = song?.display_title || song?.title || "Unknown Title";
    const artistName = song?.artists?.name || "Unknown Artist";

    const seedString = `${title}|${artistName}`;
    const units = calculateDetailedUnits(
      entry.streams || 0,
      entry.sales || 0,
      entry.airplay || 0,
      seedString,
    );

    return {
      ...entry,
      calculatedUnits: units,
    };
  });

  streamifyEntries.sort((a, b) => b.calculatedUnits.streamsUnits - a.calculatedUnits.streamsUnits);

  const newEntriesCount = streamifyEntries.filter((entry) => entry.weeks_on_chart === 1).length;

  const formattedDateRange = formatDateRange(targetWeek.start_date, targetWeek.end_date);

  return (
    <div className="font-geist min-h-screen bg-[#121212] text-white selection:bg-[#1db954] selection:text-black">
      {/* SPOTIFY-STYLE HERO BANNER */}
      <div className="relative w-full bg-gradient-to-b from-[#1ed760]/30 via-[#121212]/80 to-[#121212] px-8 pt-12 pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-end gap-8 md:flex-row">
          <div className="flex h-52 w-52 shrink-0 items-center justify-center border-4 border-black bg-[#1ed760] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-black">
              <span className="text-xs font-black tracking-[0.2em] uppercase">Streamify</span>
              <span className="text-4xl font-black tracking-tighter uppercase">Top 50</span>
              <span className="mt-2 text-[10px] font-bold tracking-widest uppercase">Global</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-black tracking-widest text-[#1ed760] uppercase">
                Verified Playlist
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-tighter text-white uppercase md:text-7xl">
              Top Songs - Global
            </h1>
            <p className="mt-1 text-sm font-bold tracking-widest text-gray-400 uppercase">
              Your weekly update of the most played tracks right now - Global.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-300">
              <span className="font-black text-white">So Casual Charts</span>
              <span>•</span>
              <span>{streamifyEntries.length} songs</span>
              <span>•</span>
              <span className="text-gray-400">{formattedDateRange}</span>
              {newEntriesCount > 0 && (
                <>
                <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-blue-400">
                      {newEntriesCount} new {newEntriesCount === 1 ? "entry" : "entries"}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                </>
              )}
              
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
            <button className="text-gray-400 transition-colors hover:text-white">
              <Shuffle size={22} />
            </button>
            <button className="text-gray-400 transition-colors hover:text-white">
              <ArrowDownToLine size={22} />
            </button>
            <button className="text-gray-400 transition-colors hover:text-white">
              <MoreHorizontal size={22} />
            </button>
          </div>

          <div className="pb-1">
            <WeekSelector
              weeks={historicalWeeks}
              activeWeek={targetWeek.start_date}
              destination="/charts/streamify"
            />
          </div>
        </div>

        {/* TRACK LIST TABLE */}
        <div className="mt-6 w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase">
                <th className="w-12 px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 text-right">Streams</th>
                <th className="px-4 py-3">Album</th>
                <th className="w-20 px-4 py-3 text-center">Year</th>
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
                const isNewEntry = entry.weeks_on_chart === 1;

                const streamUnits = entry.calculatedUnits.streamsUnits;

                return (
                  <tr key={entry.id} className="group transition-colors hover:bg-zinc-900/80">
                    <td className="px-4 py-3 text-center font-mono text-gray-400 group-hover:text-white">
                      <div className="flex flex-col items-center justify-center">
                        <span>{rank}</span>
                        {isNewEntry && (
                          <span
                            className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]"
                            title="New Entry"
                          />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden border border-zinc-700 bg-zinc-800">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <Link
                            href={`/library/song/${song?.id}`}
                            className="truncate font-bold text-white transition-colors hover:text-[#1ed760] hover:underline"
                          >
                            {title}
                          </Link>
                          <span className="truncate text-xs font-medium text-gray-400">
                            {artistName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-black tracking-wider text-[#1ed760]">
                      {streamUnits.toLocaleString("en-US")}
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 font-medium text-gray-400">
                      <Link
                        href={`/library/album/${song?.albums?.id}`}
                        className="truncate hover:text-white hover:underline"
                      >
                        {albumTitle}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">--</td>
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
