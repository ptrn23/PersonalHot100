import RecordBlock from "../../components/RecordBlock";
import { RecordEntry } from "@/types";
import { formatNumber, formatShortDate } from "@/utils/formatters";
import { calculateDetailedUnits, CalculatedUnits } from "@/utils/metrics";
import { CHART_NAME } from "@/config/constants";

import { getAllChartRecords } from "@/lib/db/records";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const records = await getAllChartRecords();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToRecord = (row: any, metricFormat: (r: any, units: CalculatedUnits) => number) => {
    const songData = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    const artistData = Array.isArray(songData?.artists) ? songData.artists[0] : songData?.artists;
    const albumData = Array.isArray(songData?.albums) ? songData.albums[0] : songData?.albums;
    const dateStr = row.chart_weeks?.start_date;

    const title = songData?.display_title || songData?.title || "Unknown Song";
    const artist = artistData?.display_name || artistData?.name || "Unknown Artist";

    const units = calculateDetailedUnits(
      row.streams || 0,
      row.sales || 0,
      row.airplay || 0,
      `${title}|${artist}`,
    );

    return {
      id: songData?.id || "unknown",
      coverUrl: albumData?.cover_url || null,
      title,
      artist,
      rawValue: metricFormat(row, units),
      peak: row.peak_position || 101,
      weekDisplay: formatShortDate(dateStr),
      weekUrl: dateStr ? encodeURIComponent(dateStr) : "",
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processUnitList = (
    data: any[],
    selector: (r: any, units: CalculatedUnits) => number,
    customFormatter?: (val: number) => string | number,
  ): RecordEntry[] => {
    return data
      .map((row) => mapToRecord(row, selector))
      .sort((a, b) => b.rawValue - a.rawValue)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        metricValue: customFormatter
          ? customFormatter(entry.rawValue)
          : formatNumber(entry.rawValue),
      }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFlatRecord = (
    row: any,
    index: number,
    metricFormat: (row: any) => string | number,
  ): RecordEntry => {
    return {
      id: row.song_id || row.id,
      rank: index + 1,
      coverUrl: row.cover_url || null,
      title: row.display_title || row.title || "Unknown Song",
      artist: row.artist_display_name || row.artist_name || "Unknown Artist",
      metricValue: metricFormat(row),
      peak: row.peak_position || row.rank || 101,
      weekDisplay: formatShortDate(row.start_date),
      weekUrl: row.start_date ? encodeURIComponent(row.start_date) : "",
    };
  };

  const highestPointsEntries = processUnitList(
    records.highestPoints,
    (r, units) => r.total_points || 0,
    (val) => val.toLocaleString("en-US"),
  );

  const highestDebutEntries = processUnitList(
    records.highestDebut,
    (r, units) => r.total_points || 0,
    (val) => val.toLocaleString("en-US"),
  );

  const biggestJumpEntries = records.biggestJump.map((row, i) =>
    mapFlatRecord(row, i, (r) => `+${r.position_change}`),
  );
  const biggestFallEntries = records.biggestFall.map((row, i) =>
    mapFlatRecord(row, i, (r) => `${r.position_change}`),
  );
  const biggestJumpTo1Entries = records.biggestJumpTo1.map((row, i) =>
    mapFlatRecord(row, i, (r) => `+${r.position_change}`),
  );
  const biggestFallFrom1Entries = records.biggestFallFrom1.map((row, i) =>
    mapFlatRecord(row, i, (r) => `${r.position_change}`),
  );

  const longestFirstRunEntries = records.longestFirstRun.map((row, i) =>
    mapFlatRecord(row, i, (r) => `${r.run_length}`),
  );

  const highestSalesEntries = processUnitList(records.highestSales, (r, units) => units.salesUnits);
  const highestStreamsEntries = processUnitList(
    records.highestStreams,
    (r, units) => units.streamsUnits,
  );
  const highestAirplayEntries = processUnitList(
    records.highestAirplay,
    (r, units) => units.airplayUnits,
  );

  const highestDebutSalesEntries = processUnitList(
    records.highestDebutSales,
    (r, units) => units.salesUnits,
  );
  const highestDebutStreamsEntries = processUnitList(
    records.highestDebutStreams,
    (r, units) => units.streamsUnits,
  );
  const highestDebutAirplayEntries = processUnitList(
    records.highestDebutAirplay,
    (r, units) => units.airplayUnits,
  );

  const mostWeeksAt1Entries = records.mostWeeksAt1.map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_at_1);
    entry.weekDisplay = formatShortDate(row.last_week_at_1);
    entry.weekUrl = row.last_week_at_1 ? encodeURIComponent(row.last_week_at_1) : "";
    return entry;
  });

  const mostWeeksTop10Entries = records.mostWeeksTop10.map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_in_top_10);
    entry.weekDisplay = formatShortDate(row.last_week_in_top_10);
    entry.weekUrl = row.last_week_in_top_10 ? encodeURIComponent(row.last_week_in_top_10) : "";
    return entry;
  });

  const mostWeeksTop25Entries = records.mostWeeksTop25.map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.weeks_in_top_25);
    entry.weekDisplay = formatShortDate(row.last_week_in_top_25);
    entry.weekUrl = row.last_week_in_top_25 ? encodeURIComponent(row.last_week_in_top_25) : "";
    return entry;
  });

  const mostTotalWeeksEntries = records.mostTotalWeeks.map((row, i) => {
    const entry = mapFlatRecord(row, i, (r) => r.total_weeks);
    entry.weekDisplay = formatShortDate(row.last_week_on_chart);
    entry.weekUrl = row.last_week_on_chart ? encodeURIComponent(row.last_week_on_chart) : "";
    return entry;
  });

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-900">
      <div className="mb-12 border-b border-gray-200 bg-white pt-16 pb-12 shadow-sm">
        <div className="mx-auto max-w-[1000px] px-8">
          <h1 className="mb-4 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
            Records
          </h1>
          <p className="max-w-2xl text-lg font-medium text-gray-500">
            The list of the biggest moments, highest peaks, and longest runs in the history of the
            {CHART_NAME} Charts.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-8">
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
          title="Most Total Weeks on Chart"
          metricLabel="WEEKS"
          entries={mostTotalWeeksEntries}
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

        <RecordBlock
          title="Most Sales in a Week"
          metricLabel="SALES"
          entries={highestSalesEntries}
        />
        <RecordBlock
          title="Most Sales in a Debut Week"
          metricLabel="SALES"
          entries={highestDebutSalesEntries}
        />

        <RecordBlock
          title="Most Streams in a Week"
          metricLabel="STREAMS"
          entries={highestStreamsEntries}
        />
        <RecordBlock
          title="Most Streams in a Debut Week"
          metricLabel="STREAMS"
          entries={highestDebutStreamsEntries}
        />

        <RecordBlock
          title="Most Airplay in a Week"
          metricLabel="PLAYS"
          entries={highestAirplayEntries}
        />
        <RecordBlock
          title="Most Airplay in a Debut Week"
          metricLabel="PLAYS"
          entries={highestDebutAirplayEntries}
        />

        <RecordBlock title="Most Weeks at #1" metricLabel="WEEKS" entries={mostWeeksAt1Entries} />
        <RecordBlock
          title="Most Weeks in the Top 10"
          metricLabel="WEEKS"
          entries={mostWeeksTop10Entries}
        />
        <RecordBlock
          title="Most Weeks in the Top 25"
          metricLabel="WEEKS"
          entries={mostWeeksTop25Entries}
        />
      </div>
    </main>
  );
}
