import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartView from "../../components/ChartView";
import { DisplayEntry } from "../../components/ChartRow"; // 🚨 Use the new flat type

export const dynamic = "force-dynamic";

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

  let mappedEntries: DisplayEntry[] = [];

  if (section === "songs") {
    // Query the ultra-fast SQL view
    const { data: topSongs } = await supabase
      .from("all_time_song_stats")
      .select("*")
      .order("total_points", { ascending: false })
      .range(startRange, endRange);

    if (topSongs) {
      // 🚨 THE ADAPTER: Map flat SQL view directly to DisplayEntry
      mappedEntries = topSongs.map((row, index) => {
        const title = row.display_title || row.title || "Unknown Song";
        const artist = row.artist_display_name || row.artist_name || "Unknown Artist";

        return {
          // Identify the row
          id: row.id,
          rank: startRange + index + 1,
          previousRank: null, // Hides the +/- math
          
          // Visuals
          coverUrl: row.cover_url || null,
          primaryText: title,
          primaryHref: row.id ? `/library/song/${row.id}` : null,
          secondaryText: artist,
          secondaryHref: row.artist_id ? `/library/artist/${row.artist_id}` : null,
          
          // Math & UI Flags
          mathSeedString: `${title}|${artist}`,
          disableDropdown: true, // Disable dropdown for All-Time
          hideRankChange: true,  // Tell ChartRow to hide the +/- text
          
          // Metrics
          isNewPeak: false,
          isRePeak: false,
          peakPosition: row.peak_position || 101,
          peakStreak: null,
          weeksOnChart: row.weeks_on_chart || 1,
          
          // Points
          totalPoints: row.total_points || 0,
          currentWeekPoints: 0,
          previousWeekRawPoints: null,
          twoWeeksAgoRawPoints: null,
          sales: row.sales || 0,
          streams: row.streams || 0,
          airplay: row.airplay || 0,
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

      {/* Page Header */}
      <div className="max-w-[1450px] mx-auto pt-10 px-8 text-center mb-2">
        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">
          All-Time {section === "songs" ? "Hot 100" : section === "albums" ? "Top Albums" : "Top Artists"}
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
          The Greatest Performers in History
        </p>
      </div>

      {section === "songs" && (
        <>
          {/* 🚨 Clean, decoupled ChartView */}
          <ChartView
            entries={mappedEntries}
            hideRankChangeColumn={true}
            chartLabel="All-Time"
            exportFileNamePrefix={`AllTime_Songs_Page${currentPage}`}
          />

          {/* Pagination Footer */}
          <div className="max-w-[1450px] mx-auto px-8 mt-8 flex justify-between items-center">
            {currentPage > 1 ? (
              <Link
                href={`/charts/alltime?section=songs&page=${currentPage - 1}`}
                className="bg-white border-2 border-gray-200 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:border-black transition-colors"
              >
                &larr; Prev 100
              </Link>
            ) : <div />}
            
            {/* Only show next page if we actually fetched a full 100 items */}
            {mappedEntries.length === 100 && (
              <Link
                href={`/charts/alltime?section=songs&page=${currentPage + 1}`}
                className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors"
              >
                Next 100 &rarr;
              </Link>
            )}
          </div>
        </>
      )}

      {(section === "albums" || section === "artists") && (
        <div className="max-w-[1450px] mx-auto px-8 mt-8">
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