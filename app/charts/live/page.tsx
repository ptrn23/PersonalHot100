import { supabase } from "@/utils/supabase";
import ChartView from "../../components/ChartView"; 

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

export default async function LiveChartPage() {
  const { data: latestWeek, error: weekErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (weekErr || !latestWeek) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Live Data</h1>
        <p className="text-gray-600">The tracking engine is currently initializing.</p>
      </div>
    );
  }

  const { data: entries } = await supabase
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
    .eq("week_id", latestWeek.id)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  return (
    <ChartView
      entries={entries}
      availableWeeks={[latestWeek.start_date]} 
      activeWeekDate={latestWeek.start_date}
      formattedDateRange={`${formatDateRange(latestWeek.start_date, latestWeek.end_date)}`}
    />
  );
}