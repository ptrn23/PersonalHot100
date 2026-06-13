import { supabase } from "@/utils/supabase";
import RecordBlock, { RecordEntry } from "../../components/RecordBlock";
import { formatNumber } from "../../utils/chartMath";

export const dynamic = "force-dynamic";

const formatRecordDate = (isoString?: string) => {
  if (!isoString) return "--";
  const d = new Date(isoString);
  const m = d.getMonth() + 1;
  const day = d.getDate().toString().padStart(2, "0");
  const y = d.getFullYear().toString().slice(2);
  return `${m}/${day}/${y}`;
};

export default async function RecordsPage() {
  const entrySelect = "id, total_points, sales, streams, airplay, peak_position, chart_weeks(start_date), songs(id, title, display_title, artists(name, display_name), albums(cover_url))";

  const [
    highestPointsRes, highestDebutRes, biggestJumpRes, biggestFallRes, biggestJumpTo1Res, longestFirstRunRes, biggestFallFrom1Res,
    highestSalesRes, highestStreamsRes, highestAirplayRes,
    highestDebutSalesRes, highestDebutStreamsRes, highestDebutAirplayRes,
    mostWeeksAt1Res, mostWeeksTop10Res, mostWeeksTop25Res
  ] = await Promise.all([
    supabase.from("chart_entries").select(entrySelect).order("total_points", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("total_points", { ascending: false }).limit(10),
    supabase.from("record_jumps_falls").select("*").order("position_change", { ascending: false }).limit(10),
    supabase.from("record_jumps_falls").select("*").order("position_change", { ascending: true }).limit(10),
    supabase.from("record_jumps_falls").select("*").eq("rank", 1).order("position_change", { ascending: false }).limit(10),
    supabase.from("record_longest_first_runs").select("*").order("run_length", { ascending: false }).limit(10),
    supabase.from("record_jumps_falls").select("*").eq("previous_position", 1).order("position_change", { ascending: true }).limit(10),
    
    supabase.from("chart_entries").select(entrySelect).order("sales", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).order("streams", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).order("airplay", { ascending: false }).limit(10),

    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("sales", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("streams", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("airplay", { ascending: false }).limit(10),

    supabase.from("record_weeks_at_ranks").select("*").order("weeks_at_1", { ascending: false }).limit(10),
    supabase.from("record_weeks_at_ranks").select("*").order("weeks_in_top_10", { ascending: false }).limit(10),
    supabase.from("record_weeks_at_ranks").select("*").order("weeks_in_top_25", { ascending: false }).limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToRecord = (row: any, index: number, metricFormat: (r: any) => string | number): RecordEntry => {
    const songData = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    const artistData = Array.isArray(songData?.artists) ? songData.artists[0] : songData?.artists;
    const albumData = Array.isArray(songData?.albums) ? songData.albums[0] : songData?.albums;
    const dateStr = row.chart_weeks?.start_date;

    return {
      id: songData?.id || "unknown",
      rank: index + 1,
      coverUrl: albumData?.cover_url || null,
      title: songData?.display_title || songData?.title || "Unknown Song",
      artist: artistData?.display_name || artistData?.name || "Unknown Artist",
      metricValue: metricFormat(row),
      peak: row.peak_position || 101,
      weekDisplay: formatRecordDate(dateStr),
      weekUrl: dateStr ? encodeURIComponent(dateStr) : "",
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFlatRecord = (row: any, index: number, metricFormat: (row: any) => string | number): RecordEntry => {
    return {
      id: row.song_id || row.id,
      rank: index + 1,
      coverUrl: row.cover_url || null,
      title: row.display_title || row.title || "Unknown Song",
      artist: row.artist_display_name || row.artist_name || "Unknown Artist",
      metricValue: metricFormat(row),
      peak: row.peak_position || row.rank || 101,
      weekDisplay: formatRecordDate(row.start_date),
      weekUrl: row.start_date ? encodeURIComponent(row.start_date) : "",
    };
  };

  const highestPointsEntries = (highestPointsRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.total_points)));
  const highestDebutEntries = (highestDebutRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.total_points)));
  
  const biggestJumpEntries = (biggestJumpRes.data || []).map((row, i) => mapFlatRecord(row, i, (r) => `+${r.position_change}`));
  const biggestFallEntries = (biggestFallRes.data || []).map((row, i) => mapFlatRecord(row, i, (r) => `${r.position_change}`));
  const biggestJumpTo1Entries = (biggestJumpTo1Res.data || []).map((row, i) => mapFlatRecord(row, i, (r) => `+${r.position_change}`));
  const biggestFallFrom1Entries = (biggestFallFrom1Res.data || []).map((row, i) => mapFlatRecord(row, i, (r) => `${r.position_change}`));
  
  const longestFirstRunEntries = (longestFirstRunRes.data || []).map((row, i) => mapFlatRecord(row, i, (r) => `${r.run_length}`));

  const highestSalesEntries = (highestSalesRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.sales)));
  const highestStreamsEntries = (highestStreamsRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.streams)));
  const highestAirplayEntries = (highestAirplayRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.airplay)));

  const highestDebutSalesEntries = (highestDebutSalesRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.sales)));
  const highestDebutStreamsEntries = (highestDebutStreamsRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.streams)));
  const highestDebutAirplayEntries = (highestDebutAirplayRes.data || []).map((row, i) => mapToRecord(row, i, (r) => formatNumber(r.airplay)));

  const mostWeeksAt1Entries = (mostWeeksAt1Res.data || []).map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_at_1);
    entry.weekDisplay = formatRecordDate(row.last_week_at_1);
    entry.weekUrl = row.last_week_at_1 ? encodeURIComponent(row.last_week_at_1) : "";
    return entry;
  });

  const mostWeeksTop10Entries = (mostWeeksTop10Res.data || []).map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_in_top_10);
    entry.weekDisplay = formatRecordDate(row.last_week_in_top_10);
    entry.weekUrl = row.last_week_in_top_10 ? encodeURIComponent(row.last_week_in_top_10) : "";
    return entry;
  });

  const mostWeeksTop25Entries = (mostWeeksTop25Res.data || []).map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_in_top_25);
    entry.weekDisplay = formatRecordDate(row.last_week_in_top_25);
    entry.weekUrl = row.last_week_in_top_25 ? encodeURIComponent(row.last_week_in_top_25) : "";
    return entry;
  });

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

        <RecordBlock
          title="Longest Consecutive First Run"
          metricLabel="WEEKS"
          entries={longestFirstRunEntries}
        />

        <RecordBlock
          title="Biggest Position Jump"
          metricLabel="JUMP"
          entries={biggestJumpEntries}
        />

        <RecordBlock
          title="Biggest Position Fall"
          metricLabel="FALL"
          entries={biggestFallEntries}
        />

        <RecordBlock
          title="Biggest Jump to #1"
          metricLabel="JUMP"
          entries={biggestJumpTo1Entries}
        />

        <RecordBlock 
          title="Biggest Fall from #1" 
          metricLabel="FALL" 
          entries={biggestFallFrom1Entries} 
        />

        <RecordBlock title="Most Sales in a Week" metricLabel="SALES" entries={highestSalesEntries} />
        <RecordBlock title="Most Sales in a Debut Week" metricLabel="SALES" entries={highestDebutSalesEntries} />
        
        <RecordBlock title="Most Streams in a Week" metricLabel="STREAMS" entries={highestStreamsEntries} />
        <RecordBlock title="Most Streams in a Debut Week" metricLabel="STREAMS" entries={highestDebutStreamsEntries} />

        <RecordBlock title="Most Airplay in a Week" metricLabel="PLAYS" entries={highestAirplayEntries} />
        <RecordBlock title="Most Airplay in a Debut Week" metricLabel="PLAYS" entries={highestDebutAirplayEntries} />
        
        <RecordBlock title="Most Weeks at #1" metricLabel="WEEKS" entries={mostWeeksAt1Entries} />
        <RecordBlock title="Most Weeks in the Top 10" metricLabel="WEEKS" entries={mostWeeksTop10Entries} />
        <RecordBlock title="Most Weeks in the Top 25" metricLabel="WEEKS" entries={mostWeeksTop25Entries} />

      </div>
    </main>
  );
}