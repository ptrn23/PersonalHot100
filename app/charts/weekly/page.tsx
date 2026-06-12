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

export default async function WeeklyChartPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedWeekStr = resolvedParams.week;

  const { data: latestWeek, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (weekErr || !latestWeek) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Weekly Data</h1>
        <p className="text-gray-600">No chart weeks have been generated yet.</p>
      </div>
    );
  }

  const { data: allWeeks } = await supabase
    .from("chart_weeks")
    .select("*")
    .neq("id", latestWeek.id)
    .order("start_date", { ascending: false });

  if (!allWeeks || allWeeks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Finalized Weeks</h1>
        <p className="text-gray-600">The first tracking week is still in progress!</p>
      </div>
    );
  }

  let targetWeek = allWeeks.find((w) => w.start_date === selectedWeekStr);
  if (!targetWeek) {
    targetWeek = allWeeks[0]; 
  }

  const { data: rawEntries, error } = await supabase
    .from("chart_entries")
    .select(`
      *,
      songs (
        id,
        title,
        display_title,
        artists ( id, name, display_name ),
        albums ( id, title, display_title, cover_url )
      )
    `)
    .eq("week_id", targetWeek.id)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  if (error || !rawEntries) {
    return <div className="p-10 text-center font-bold text-red-500">Failed to load chart data.</div>;
  }

  const mappedEntries: DisplayEntry[] = rawEntries.map((row: any) => {
    const songData = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    const artistData = Array.isArray(songData?.artists) ? songData.artists[0] : songData?.artists;
    const albumData = Array.isArray(songData?.albums) ? songData.albums[0] : songData?.albums;

    const title = songData?.display_title || songData?.title || "Unknown Song";
    const artist = artistData?.display_name || artistData?.name || "Unknown Artist";

    return {
      id: row.id,
      rank: row.rank,
      previousRank: row.previous_position,
      coverUrl: albumData?.cover_url || null,
      primaryText: title,
      primaryHref: songData?.id ? `/library/song/${songData.id}` : null,
      secondaryText: artist,
      secondaryHref: artistData?.id ? `/library/artist/${artistData.id}` : null,
      mathSeedString: `${title}|${artist}`,
      isNewPeak: row.is_new_peak || false,
      isRePeak: row.is_repeak || false,
      peakPosition: row.peak_position || 101,
      peakStreak: row.peak_streak || null,
      weeksOnChart: row.weeks_on_chart || 1,
      totalPoints: row.total_points || 0,
      currentWeekPoints: row.current_week_points || 0,
      previousWeekRawPoints: row.previous_week_raw_points || null,
      twoWeeksAgoRawPoints: row.two_weeks_ago_raw_points || null,
      sales: row.sales || 0,
      streams: row.streams || 0,
      airplay: row.airplay || 0,
    };
  });

  const formattedDate = formatDateRange(targetWeek.start_date, targetWeek.end_date);
  const availableWeekStrings = allWeeks.map((w) => w.start_date);

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-[1450px] mx-auto pt-8 px-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Hot 100
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
            Week of {formattedDate}
          </p>
        </div>
        
        <div className="pb-1">
          <WeekSelector 
            weeks={availableWeekStrings} 
            activeWeek={targetWeek.start_date}
            destination={`/charts/weekly`} 
          />
        </div>
      </div>

      <ChartView
        entries={mappedEntries}
        exportFileNamePrefix={`Weekly100_${targetWeek.start_date}`}
        chartLabel={formattedDate}
      />
    </main>
  );
}
