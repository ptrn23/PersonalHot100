import { supabase } from "@/utils/supabase";
import RecordBlock, { RecordEntry } from "../../components/RecordBlock";
import { formatNumber } from "../../utils/chartMath";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const [highestPointsRes, highestDebutRes] = await Promise.all([
    supabase
      .from("chart_entries")
      .select(`
        id,
        total_points,
        peak_position,
        weeks_on_chart,
        songs (
          id,
          title,
          display_title,
          artists ( name, display_name ),
          albums ( cover_url )
        )
      `)
      .order("total_points", { ascending: false })
      .limit(10),

    supabase
      .from("chart_entries")
      .select(`
        id,
        total_points,
        peak_position,
        weeks_on_chart,
        songs (
          id,
          title,
          display_title,
          artists ( name, display_name ),
          albums ( cover_url )
        )
      `)
      .eq("weeks_on_chart", 1)
      .order("total_points", { ascending: false })
      .limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToRecord = (row: any, index: number, metricFormat: (val: number) => string | number): RecordEntry => {
    const songData = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    const artistData = Array.isArray(songData?.artists) ? songData.artists[0] : songData?.artists;
    const albumData = Array.isArray(songData?.albums) ? songData.albums[0] : songData?.albums;

    return {
      id: songData?.id || "unknown",
      rank: index + 1,
      coverUrl: albumData?.cover_url || null,
      title: songData?.display_title || songData?.title || "Unknown Song",
      artist: artistData?.display_name || artistData?.name || "Unknown Artist",
      metricValue: metricFormat(row.total_points),
      peak: row.peak_position || 101,
      weeks: row.weeks_on_chart || 1,
    };
  };

  const highestPointsEntries = (highestPointsRes.data || []).map((row, i) =>
    mapToRecord(row, i, (val) => formatNumber(val))
  );

  const highestDebutEntries = (highestDebutRes.data || []).map((row, i) =>
    mapToRecord(row, i, (val) => formatNumber(val))
  );

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-24">
      <div className="bg-white border-b border-gray-200 pt-16 pb-12 mb-12 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            Records
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-lg">
            The list of the biggest moments, highest peaks, and longest runs in the history of the Personal Charts.
          </p>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-8">
        <RecordBlock
          title="Most Points in a Single Week"
          metricLabel="PTS"
          entries={highestPointsEntries}
        />

        <RecordBlock
          title="Most Points in a Debut Week"
          metricLabel="PTS"
          entries={highestDebutEntries}
        />

      </div>
    </main>
  );
}