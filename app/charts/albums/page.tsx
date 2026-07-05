import ChartView from "../../components/ChartView";
import { DisplayEntry } from "@/types";
import WeekSelector from "../../components/WeekSelector";
import { formatDateRange } from "@/utils/formatters";

import { getAllChartWeeks, getWeeklyAlbumsByWeekId } from "@/lib/db/charts";

export const dynamic = "force-dynamic";

export default async function WeeklyAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedWeekStr = resolvedParams.week;
  const allChartWeeks = await getAllChartWeeks();

  if (allChartWeeks.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-10">
        <h1 className="mb-4 text-2xl font-bold">No Weekly Data</h1>
        <p className="text-gray-600">No chart weeks have been generated yet.</p>
      </div>
    );
  }

  const latestWeek = allChartWeeks[0];
  const historicalWeeks = allChartWeeks.filter((w) => w.id !== latestWeek.id);

  if (historicalWeeks.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-10">
        <h1 className="mb-4 text-2xl font-bold">No Weekly Data</h1>
        <p className="text-gray-600">No chart weeks have been finalized yet.</p>
      </div>
    );
  }

  let targetWeek = historicalWeeks.find((w) => w.start_date === selectedWeekStr);
  if (!targetWeek) {
    targetWeek = historicalWeeks[0];
  }

  const rawEntries = await getWeeklyAlbumsByWeekId(targetWeek.id, 20);

  if (!rawEntries || rawEntries.length === 0) {
    return (
      <div className="p-10 text-center font-bold text-red-500">Failed to load album data.</div>
    );
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedEntries: DisplayEntry[] = rawEntries.map((row: any) => {
    const title = row.album_title || "Unknown Album";
    const artist = row.artist_name || "Unknown Artist";

    return {
      id: row.id,
      rank: row.rank,
      previousRank: null,

      coverUrl: row.cover_url || null,
      primaryText: title,
      primaryHref: row.id ? `/library/album/${row.id}` : null,
      secondaryText: artist,
      secondaryHref: row.artist_id ? `/library/artist/${row.artist_id}` : null,

      mathSeedString: `${title}|${artist}`,
      disableDropdown: true,
      hideRankChange: true,

      isNewPeak: false,
      isRePeak: false,
      peakPosition: 101,
      peakStreak: null,
      weeksOnChart: 1,

      totalPoints: row.total_points || 0,
      currentWeekPoints: row.current_week_points || 0,
      previousWeekRawPoints: null,
      twoWeeksAgoRawPoints: null,
      sales: row.sales || 0,
      streams: row.streams || 0,
      airplay: row.airplay || 0,
    };
  });

  const formattedDate = formatDateRange(targetWeek.start_date, targetWeek.end_date);
  const availableWeeks = historicalWeeks.map((w) => ({
    start_date: w.start_date,
    end_date: w.end_date,
  }));

  return (
    <main className="min-h-screen bg-white pb-24 text-gray-900">
      <div className="mx-auto flex max-w-[1450px] items-end justify-between px-8 pt-8">
        <div>
          <h1 className="text-4xl leading-none font-black tracking-tighter uppercase">
            Top Albums 20
          </h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-gray-500 uppercase">
            Week of {formattedDate}
          </p>
        </div>

        <div className="pb-1">
          <WeekSelector
            weeks={availableWeeks}
            activeWeek={targetWeek.start_date}
            destination={`/charts/albums`}
          />
        </div>
      </div>

      <ChartView
        entries={mappedEntries}
        exportFileNamePrefix={`TopAlbums_${targetWeek.start_date}`}
        chartLabel={formattedDate}
        hideRankChangeColumn={true}
      />
    </main>
  );
}
