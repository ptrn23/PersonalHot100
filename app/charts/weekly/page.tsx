import { supabase } from "@/utils/supabase";
import ChartView from "../../components/ChartView";
import ChartRow, { DisplayEntry, MaxStats } from "../../components/ChartRow";
import { applyDeviation, getStableSeed } from "../../utils/chartMath";
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
    .eq("week_id", targetWeek.id)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  if (error || !rawEntries) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Failed to load chart data.
      </div>
    );
  }

  const currentSongIds = new Set(rawEntries.map((e) => e.song_id));

  const { data: prevWeek } = await supabase
    .from("chart_weeks")
    .select("id")
    .lt("start_date", targetWeek.start_date)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rawDropouts: any[] = [];
  if (prevWeek) {
    const { data: prevRaw } = await supabase
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
      .eq("week_id", prevWeek.id)
      .lte("rank", 100)
      .order("rank", { ascending: true });

    if (prevRaw) {
      rawDropouts = prevRaw.filter((row) => !currentSongIds.has(row.song_id));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToDisplayEntry = (row: any, isOut = false): DisplayEntry => {
    const songData = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    const artistData = Array.isArray(songData?.artists)
      ? songData.artists[0]
      : songData?.artists;
    const albumData = Array.isArray(songData?.albums)
      ? songData.albums[0]
      : songData?.albums;

    const title = songData?.display_title || songData?.title || "Unknown Song";
    const artist =
      artistData?.display_name || artistData?.name || "Unknown Artist";

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
      isOut: isOut,
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
  };

  const mappedEntries: DisplayEntry[] = rawEntries.map((row) =>
    mapToDisplayEntry(row, false),
  );
  const mappedDropouts: DisplayEntry[] = rawDropouts.map((row) =>
    mapToDisplayEntry(row, true),
  );
  const dropoutsMaxStats: MaxStats = {
    sales: 0,
    streams: 0,
    airplay: 0,
    units: 0,
  };
  mappedDropouts.forEach((entry) => {
    const seed = getStableSeed(entry.mathSeedString);
    const streamsUnits = applyDeviation(
      Math.floor(entry.streams * 5250 * 275),
      seed + 1,
    );
    const salesUnits = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
    const airplayUnits = applyDeviation(
      Math.floor(entry.airplay * 2250 * 5020),
      seed + 3,
    );
    const totalUnits = applyDeviation(
      Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
      seed + 4,
    );
    if (salesUnits > dropoutsMaxStats.sales)
      dropoutsMaxStats.sales = salesUnits;
    if (streamsUnits > dropoutsMaxStats.streams)
      dropoutsMaxStats.streams = streamsUnits;
    if (airplayUnits > dropoutsMaxStats.airplay)
      dropoutsMaxStats.airplay = airplayUnits;
    if (totalUnits > dropoutsMaxStats.units)
      dropoutsMaxStats.units = totalUnits;
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
            destination="/charts/weekly"
          />
        </div>
      </div>

      <ChartView
        entries={mappedEntries}
        exportFileNamePrefix={`Weekly100_${targetWeek.start_date}`}
        chartLabel={formattedDate}
      />

      {mappedDropouts.length > 0 && (
        <div className="max-w-[1450px] mx-auto px-8 mt-12">
          <details className="bg-white border-2 border-gray-200 shadow-sm overflow-hidden group">
            <summary className="p-4 bg-gray-50 font-bold uppercase tracking-widest text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors flex justify-between items-center select-none list-none [&::-webkit-details-marker]:hidden">
              <span>Left the Chart ({mappedDropouts.length})</span>
              <span className="text-xl leading-none group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>

            <div className="text-sm border-t-2 border-black bg-white overflow-x-auto">
              <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 min-w-[1200px]">
                <div className="py-2 text-center">Rank</div>
                <div className="py-2 text-center">+/-</div>
                <div className="py-2 pl-2">Song</div>
                <div className="py-2 text-center">{}</div>
                <div className="py-2 text-center">Points</div>
                <div className="py-2 text-center">%</div>
                <div className="py-2 text-center bg-blue-50/50">Peak</div>
                <div className="py-2 text-center">WoC</div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  Sales
                </div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  %
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  Streams
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  %
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  Airplay
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  %
                </div>
                <div className="py-2 text-center text-[#721a46] bg-[#eddcfe]">
                  Units
                </div>
              </div>

              <div className="min-w-[1200px]">
                {mappedDropouts.map((entry) => (
                  <ChartRow
                    key={entry.id}
                    entry={entry}
                    week={formattedDate}
                    maxStats={dropoutsMaxStats}
                  />
                ))}
              </div>
            </div>
          </details>
        </div>
      )}
    </main>
  );
}
