import { supabase } from "@/utils/supabase";
import Link from "next/link";
import ChartView from "../../components/ChartView";
import { DisplayEntry } from "@/types";

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
    const { data: topSongs } = await supabase
      .from("all_time_song_stats")
      .select("*")
      .order("total_points", { ascending: false })
      .range(startRange, endRange);

    if (topSongs) {
      mappedEntries = topSongs.map((row, index) => {
        const title = row.display_title || row.title || "Unknown Song";
        const artist = row.artist_display_name || row.artist_name || "Unknown Artist";

        return {
          id: row.id,
          rank: startRange + index + 1,
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
          peakStreak: row.peak_streak || null,
          weeksOnChart: row.weeks_on_chart || 1,

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
    <main className="min-h-screen bg-[#f5f5f5] pb-24 text-gray-900">
      <div className="border-b border-gray-200 bg-white pt-8 shadow-sm">
        <div className="mx-auto flex max-w-7xl justify-center gap-2 px-4">
          <Link
            href="/charts/alltime?section=songs"
            className={`border-b-4 px-8 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${
              section === "songs"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-600"
            }`}
          >
            Top Songs
          </Link>
          <Link
            href="/charts/alltime?section=albums"
            className={`border-b-4 px-8 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${
              section === "albums"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-600"
            }`}
          >
            Top Albums
          </Link>
          <Link
            href="/charts/alltime?section=artists"
            className={`border-b-4 px-8 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${
              section === "artists"
                ? "border-[#B30000] text-gray-900"
                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-600"
            }`}
          >
            Top Artists
          </Link>
        </div>
      </div>

      <div className="mx-auto mb-2 max-w-[1450px] px-8 pt-10 text-center">
        <h1 className="mb-2 text-5xl leading-none font-black tracking-tighter uppercase">
          All-Time{" "}
          {section === "songs" ? "Hot 100" : section === "albums" ? "Top Albums" : "Top Artists"}
        </h1>
        <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">
          The Greatest Performers in History
        </p>
      </div>

      {section === "songs" && (
        <>
          <ChartView
            entries={mappedEntries}
            hideRankChangeColumn={true}
            chartLabel="All-Time"
            exportFileNamePrefix={`AllTime_Songs_Page${currentPage}`}
          />

          <div className="mx-auto mt-8 flex max-w-[1450px] items-center justify-between px-8">
            {currentPage > 1 ? (
              <Link
                href={`/charts/alltime?section=songs&page=${currentPage - 1}`}
                className="border-2 border-gray-200 bg-white px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors hover:border-black"
              >
                &larr; Prev 100
              </Link>
            ) : (
              <div />
            )}

            {/* only show next page if we actually fetched a full 100 items */}
            {mappedEntries.length === 100 && (
              <Link
                href={`/charts/alltime?section=songs&page=${currentPage + 1}`}
                className="bg-black px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-gray-800"
              >
                Next 100 &rarr;
              </Link>
            )}
          </div>
        </>
      )}

      {(section === "albums" || section === "artists") && (
        <div className="mx-auto mt-8 max-w-[1450px] px-8">
          <div className="border-2 border-dashed border-gray-300 bg-white p-24 text-center">
            <p className="text-lg font-bold tracking-widest text-gray-400 uppercase">
              Coming soon...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
