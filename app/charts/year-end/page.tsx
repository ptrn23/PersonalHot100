import { supabase } from "@/utils/supabase";
import ChartView from "../../components/ChartView";
import { DisplayEntry } from "../../components/ChartRow";
import YearSelector from "../../components/YearSelector";

export const dynamic = "force-dynamic";

export default async function YearEndPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const resolvedParams = await searchParams;
  
  const { data: yearData } = await supabase
    .from("chart_weeks")
    .select("start_date");

  const uniqueYears = Array.from(
    new Set((yearData || []).map((w) => new Date(w.start_date).getFullYear()))
  ).sort((a, b) => b - a);

  if (uniqueYears.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Year-End Data</h1>
        <p className="text-gray-600">No chart weeks have been finalized yet.</p>
      </div>
    );
  }

  const targetYear = resolvedParams.year ? parseInt(resolvedParams.year) : uniqueYears[0];

  const { data: rawEntries, error } = await supabase
    .from("year_end_song_stats")
    .select("*")
    .eq("chart_year", targetYear)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  if (error || !rawEntries) {
    return <div className="p-10 text-center font-bold text-red-500">Failed to load year-end data.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedEntries: DisplayEntry[] = rawEntries.map((row: any) => {
    const title = row.display_title || row.title || "Unknown Song";
    const artist = row.artist_name || "Unknown Artist";

    return {
      id: row.id,
      rank: row.rank,
      previousRank: null,
      coverUrl: row.cover_url || null,
      primaryText: title,
      primaryHref: row.id ? `/library/song/${row.id}` : null,
      secondaryText: artist,
      secondaryHref: row.artist_id ? `/library/artist/${row.artist_id}` : null,
      mathSeedString: `${title}|${artist}`,
      
      disableDropdown: true,
      hideRankChange: true, 
      
      isNewPeak: false,
      isRePeak: false,
      peakPosition: row.peak_position || 101,
      peakStreak: null,
      weeksOnChart: row.weeks_on_chart || 1,
      totalPoints: row.total_points || 0,
      currentWeekPoints: row.total_points || 0,
      previousWeekRawPoints: null,
      twoWeeksAgoRawPoints: null,
      sales: row.sales || 0,
      streams: row.streams || 0,
      airplay: row.airplay || 0,
    };
  });

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-[1450px] mx-auto pt-8 px-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Year-End Hot 100
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
            Year of {targetYear}
          </p>
        </div>
        
        <div className="pb-1">
          <YearSelector 
            years={uniqueYears} 
            activeYear={targetYear} 
          />
        </div>
      </div>

      <ChartView
        entries={mappedEntries}
        exportFileNamePrefix={`YearEnd100_${targetYear}`}
        chartLabel={`Year-End ${targetYear}`}
        hideRankChangeColumn={true}
      />
    </main>
  );
}