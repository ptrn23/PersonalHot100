import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartView from "../../components/ChartView";
import { ChartEntry, MaxStats } from "../../components/ChartRow";

export default async function AllTimeChartPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const section = resolvedParams.section || "songs";
  const currentPage = parseInt(resolvedParams.page || "1", 10);
  
  const itemsPerPage = 100;
  const startRange = (currentPage - 1) * itemsPerPage;
  const endRange = startRange + itemsPerPage - 1;

  let formattedEntries: ChartEntry[] = [];
  const maxStats: MaxStats = { sales: 0, streams: 0, airplay: 0, units: 0 };

  if (section === "songs") {
    const { data: topSongs } = await supabase
      .from("all_time_song_stats")
      .select("*")
      .order("total_points", { ascending: false })
      .range(startRange, endRange);

    if (topSongs) {
      formattedEntries = topSongs.map((row, index) => {
        if (row.sales > maxStats.sales) maxStats.sales = row.sales;
        if (row.streams > maxStats.streams) maxStats.streams = row.streams;
        if (row.airplay > maxStats.airplay) maxStats.airplay = row.airplay;
        
        const units = Math.floor((row.streams + row.sales + row.airplay) * 1750 * 2);
        if (units > maxStats.units) maxStats.units = units;

        return {
          id: row.id,
          rank: startRange + index + 1,
          previous_position: null,
          is_new_peak: false,
          is_repeak: false,
          peak_position: row.peak_position,
          weeks_on_chart: row.weeks_on_chart,
          total_points: row.total_points,
          current_week_points: 0,
          previous_week_raw_points: null,
          two_weeks_ago_raw_points: null,
          peak_streak: null,
          sales: row.sales,
          streams: row.streams,
          airplay: row.airplay,
          disableSongLink: false,
          songs: {
            id: row.id,
            title: row.title,
            display_title: row.display_title,
            artists: { 
              id: row.artist_id, 
              name: row.artist_name, 
              display_name: row.artist_display_name 
            },
            albums: { 
              id: row.album_id, 
              title: row.album_title, 
              cover_url: row.cover_url 
            },
          },
        };
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pb-24">
      
      {/* Dynamic Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 pt-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-center gap-2">
          <Link
            href="/charts/alltime?section=songs"
            className={`px-8 py-3 font-bold uppercase tracking-widest text-sm border-b-4 transition-colors ${
              section === "songs"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
          >
            Top Songs
          </Link>
          <Link
            href="/charts/alltime?section=albums"
            className={`px-8 py-3 font-bold uppercase tracking-widest text-sm border-b-4 transition-colors ${
              section === "albums"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
          >
            Top Albums
          </Link>
          <Link
            href="/charts/alltime?section=artists"
            className={`px-8 py-3 font-bold uppercase tracking-widest text-sm border-b-4 transition-colors ${
              section === "artists"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
          >
            Top Artists
          </Link>
        </div>
      </div>

      {section === "songs" && (
        <>
          <ChartView
            entries={formattedEntries}
            isAllTime={true}
            hideWeekSelector={true}
            subtitleOverride="The Greatest Performing Songs in History"
            // If ChartView requires these props, just pass dummy values or make them optional in ChartViewProps!
            availableWeeks={[]} 
            activeWeekDate="All-Time"
            formattedDateRange="All-Time"
          />

          {/* Pagination Footer */}
          <div className="max-w-7xl mx-auto px-4 mt-8 flex justify-between items-center">
            {currentPage > 1 ? (
              <Link
                href={`/charts/alltime?section=songs&page=${currentPage - 1}`}
                className="bg-white border-2 border-gray-200 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:border-black transition-colors"
              >
                &larr; Prev 100
              </Link>
            ) : <div />}
            
            <Link
              href={`/charts/alltime?section=songs&page=${currentPage + 1}`}
              className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors"
            >
              Next 100 &rarr;
            </Link>
          </div>
        </>
      )}

      {(section === "albums" || section === "artists") && (
        <div className="max-w-7xl mx-auto px-4 mt-12">
          <div className="bg-white p-24 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-400 font-bold tracking-widest uppercase text-lg">
              Coming soon...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}