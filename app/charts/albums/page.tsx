import { supabase } from "@/utils/supabase";
import ChartView from "../../components/ChartView";
import { DisplayEntry } from "../../components/ChartRow";
import WeekSelector from "../../components/WeekSelector";

export const dynamic = "force-dynamic";

const formatDateRange = (startDateStr: string, endDateStr: string) => {
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  };
  const startStr = new Date(startDateStr).toLocaleDateString("en-US", options);
  const endStr = new Date(endDateStr).toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}`;
};

export default async function WeeklyAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedWeekStr = resolvedParams.week;

  const { data: latestWeek } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  const { data: allWeeks } = await supabase
    .from("chart_weeks")
    .select("*")
    .neq("id", latestWeek?.id)
    .order("start_date", { ascending: false });

  if (!allWeeks || allWeeks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Weekly Data</h1>
        <p className="text-gray-600">No chart weeks have been finalized yet.</p>
      </div>
    );
  }

  let targetWeek = allWeeks.find((w) => w.start_date === selectedWeekStr);
  if (!targetWeek) {
    targetWeek = allWeeks[0];
  }

  const { data: rawEntries, error } = await supabase
    .from("weekly_album_stats")
    .select("*")
    .eq("week_id", targetWeek.id)
    .lte("rank", 20)
    .order("rank", { ascending: true });

  if (error || !rawEntries) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Failed to load album data.
      </div>
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

  const formattedDate = formatDateRange(
    targetWeek.start_date,
    targetWeek.end_date,
  );
  const availableWeekStrings = allWeeks.map((w) => w.start_date);

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-[1450px] mx-auto pt-8 px-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Top Albums 20
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
            Week of {formattedDate}
          </p>
        </div>

        <div className="pb-1">
          <WeekSelector
            weeks={availableWeekStrings}
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
