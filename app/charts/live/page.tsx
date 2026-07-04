import { supabase } from "@/utils/supabase";
import ChartView from "../../components/ChartView";
import { DisplayEntry } from "@/types";
import { formatDateRange } from "@/utils/formatters";

export const dynamic = "force-dynamic";

export default async function LiveChartPage() {
  const { data: latestWeek, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (weekErr || !latestWeek) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-10">
        <h1 className="mb-4 text-2xl font-bold">No Live Data</h1>
      </div>
    );
  }

  const { data: rawEntries, error } = await supabase
    .from("chart_entries")
    .select(
      `
      *,
      songs (
        id,
        title,
        display_title,
        artists ( id, name, display_name ),
        albums ( id, title, display_title, cover_url )
      )
    `,
    )
    .eq("week_id", latestWeek.id)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  if (error || !rawEntries) {
    return (
      <div className="p-10 text-center font-bold text-red-500">Failed to load chart data.</div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      totalPoints: row.total_points || row.current_week_points || 0,
      currentWeekPoints: row.current_week_points || 0,
      previousWeekRawPoints: row.previous_week_raw_points || null,
      twoWeeksAgoRawPoints: row.two_weeks_ago_raw_points || null,
      sales: row.sales || 0,
      streams: row.streams || 0,
      airplay: row.airplay || 0,
    };
  });

  const formattedDate = formatDateRange(latestWeek.start_date, latestWeek.end_date);

  return (
    <main className="min-h-screen bg-white pb-24 text-gray-900">
      <div className="mx-auto flex max-w-[1450px] items-end justify-between px-8 pt-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-sm bg-red-50 px-3 py-1 text-[10px] font-bold tracking-widest text-red-600 uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live
          </div>
          <h1 className="text-4xl leading-none font-black tracking-tighter uppercase">Hot 100</h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-gray-500 uppercase">
            Week of {formattedDate}
          </p>
        </div>
      </div>

      <ChartView
        entries={mappedEntries}
        exportFileNamePrefix={`Live100_${latestWeek.start_date}`}
        chartLabel={formattedDate}
      />
    </main>
  );
}
