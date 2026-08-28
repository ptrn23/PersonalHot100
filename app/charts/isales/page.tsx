import Link from "next/link";
import { getChartEntriesByWeekId, getAllChartWeeks } from "@/lib/db/charts";
import { ShoppingCart, Disc, SkipBack, Play, SkipForward, Sparkles, Flame } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import WeekSelector from "../../components/WeekSelector";

type ISalesPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function ISalesPage({ searchParams }: ISalesPageProps) {
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
      <div className="font-geist flex min-h-screen items-center justify-center bg-[#fde68a] font-bold text-black">
        No completed chart week found.
      </div>
    );
  }

  const rawEntries = await getChartEntriesByWeekId(targetWeek.id, 50);

  const isalesEntries = rawEntries.map((entry) => {
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

  isalesEntries.sort((a, b) => b.calculatedUnits.salesUnits - a.calculatedUnits.salesUnits);

  const topTen = isalesEntries.slice(0, 10);
  const restEntries = isalesEntries.slice(10, 50);
  const newReleases = isalesEntries.filter((entry) => entry.weeks_on_chart === 1);

  const formattedDateRange = formatDateRange(targetWeek.start_date, targetWeek.end_date);

  return (
    <div className="font-geist min-h-screen bg-[#fef3c7] pb-24 text-gray-900 selection:bg-amber-400 selection:text-black">
      <div className="w-full border-b-2 border-gray-600 bg-[#d1d5db] px-6 py-2.5 shadow-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border border-red-700 bg-red-500 shadow-inner" />
              <div className="h-3 w-3 rounded-full border border-yellow-700 bg-yellow-500 shadow-inner" />
              <div className="h-3 w-3 rounded-full border border-green-700 bg-green-500 shadow-inner" />
            </div>
            <div className="h-4 w-[1px] bg-gray-500" />
            <div className="flex items-center gap-2 text-gray-800">
              <button className="transition-colors hover:text-black">
                <SkipBack size={16} fill="currentColor" />
              </button>
              <button className="rounded-full border border-gray-500 bg-gray-200 p-1.5 text-black shadow hover:bg-white">
                <Play size={13} fill="currentColor" className="ml-0.5" />
              </button>
              <button className="transition-colors hover:text-black">
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest text-black uppercase drop-shadow-sm">
              iSales Music Store
            </span>
          </div>

          <div>
            <WeekSelector
              weeks={historicalWeeks}
              activeWeek={targetWeek.start_date}
              destination="/charts/isales"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-4">
        <div className="flex flex-col items-center justify-between gap-6 border-2 border-black bg-amber-400 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-black bg-black text-amber-400 shadow">
              <ShoppingCart size={32} />
            </div>
            <div>
              <span className="bg-black px-2 py-0.5 text-[10px] font-black tracking-widest text-white uppercase">
                Featured Storefront
              </span>
              <h1 className="mt-1 text-3xl font-black tracking-tighter text-black uppercase md:text-5xl">
                Top Song Downloads
              </h1>
            </div>
          </div>
          <div className="border border-black bg-white px-4 py-2 text-right text-xs font-black tracking-widest text-black uppercase">
            Total Charted: {isalesEntries.length} Tracks
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-4">
        <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
              <Flame size={18} className="fill-amber-500 text-amber-500" /> Top Sellers
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5">
            {topTen.map((entry, idx) => {
              const song = entry.songs;
              const title = song?.display_title || song?.title || "Unknown";
              const artistName = song?.artists?.name || "Unknown Artist";
              const coverUrl = song?.albums?.cover_url;
              const salesUnits = entry.calculatedUnits.salesUnits;

              return (
                <div
                  key={entry.id}
                  className="flex flex-col border-2 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                >
                  <div className="relative mb-3 aspect-square w-full overflow-hidden border border-black bg-gray-200 shadow-inner">
                    <span className="absolute top-0 left-0 bg-black px-2 py-0.5 text-xs font-black text-amber-400">
                      #{idx + 1}
                    </span>
                    {coverUrl ? (
                      <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        NO ART
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/library/song/${song?.id}`}
                    className="truncate text-sm font-black text-black hover:underline"
                  >
                    {title}
                  </Link>
                  <span className="mb-2 truncate text-xs font-bold tracking-wider text-gray-500 uppercase">
                    {artistName}
                  </span>
                  <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="font-mono text-xs font-black text-amber-600">
                      {salesUnits.toLocaleString()} sold
                    </span>
                    <button className="border border-black bg-amber-400 px-2.5 py-1 text-[11px] font-black text-black uppercase shadow-sm hover:bg-amber-500">
                      $1.29
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {newReleases.length > 0 && (
          <div className="border-2 border-black bg-amber-100/50 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-widest uppercase">
                <Sparkles size={18} className="fill-amber-400 text-amber-500" /> New Releases
              </h2>
              <span className="border border-black bg-white px-2 py-0.5 text-xs font-bold tracking-widest text-black uppercase">
                {newReleases.length} New This Week
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {newReleases.slice(0, 6).map((entry) => {
                const song = entry.songs;
                const title = song?.display_title || song?.title || "Unknown";
                const artistName = song?.artists?.name || "Unknown Artist";
                const coverUrl = song?.albums?.cover_url;

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col border border-black bg-white p-2.5 shadow-sm"
                  >
                    <div className="mb-2 aspect-square w-full overflow-hidden border border-black bg-gray-200">
                      {coverUrl ? (
                        <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <Link
                      href={`/library/song/${song?.id}`}
                      className="truncate text-xs font-bold text-black hover:underline"
                    >
                      {title}
                    </Link>
                    <span className="truncate text-[10px] font-medium text-gray-500 uppercase">
                      {artistName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase">Store</h2>
            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Rank 11 – 50
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
            {restEntries.map((entry, index) => {
              const song = entry.songs;
              const title = song?.display_title || song?.title || "Unknown";
              const artistName = song?.artists?.name || "Unknown Artist";
              const coverUrl = song?.albums?.cover_url;
              const actualRank = index + 11;
              const salesUnits = entry.calculatedUnits.salesUnits;

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 border border-black bg-gray-50 p-2.5 transition-colors hover:bg-amber-50"
                >
                  <span className="w-6 text-center font-mono text-xs font-black text-gray-400">
                    #{actualRank}
                  </span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden border border-black bg-gray-200">
                    {coverUrl ? (
                      <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col truncate">
                    <Link
                      href={`/library/song/${song?.id}`}
                      className="truncate text-xs font-bold text-black hover:underline"
                    >
                      {title}
                    </Link>
                    <span className="truncate text-[10px] font-medium text-gray-500 uppercase">
                      {artistName}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-amber-600">
                      {salesUnits.toLocaleString()} sold
                    </span>
                  </div>
                  <button className="border border-black bg-amber-400 px-2.5 py-1 text-[10px] font-black text-black uppercase shadow-xs hover:bg-amber-500">
                    $1.29
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
