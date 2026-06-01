import { supabase } from "@/utils/supabase";
import ChartView from "./components/ChartView";
import Link from "next/link";

const formatDateRange = (startDateStr: string, endDateStr: string) => {
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  };
  const startStr = new Date(startDateStr).toLocaleDateString("en-US", options);
  const endStr = new Date(endDateStr).toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}`;
};

const isValidDateString = (dateStr: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;

  const { data: availableWeeks, error: weeksErr } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false });

  if (weeksErr || !availableWeeks || availableWeeks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Data Found</h1>
        <p className="mb-4 text-gray-600">The database is currently empty.</p>
      </div>
    );
  }

  let activeWeek = availableWeeks[0];

  if (params.week) {
    if (!isValidDateString(params.week)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white text-center">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-red-600">
            Invalid Date Format
          </h1>
          <p className="text-gray-500 mb-8 font-medium">
            Dates must be requested in YYYY-MM-DD format.
          </p>
          <Link
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
          >
            Return to Current Chart
          </Link>
        </div>
      );
    }

    const exactMatch = availableWeeks.find((w) => w.end_date === params.week);

    if (exactMatch) {
      activeWeek = exactMatch;
    } else {
      const targetDate = new Date(params.week);
      const containingWeek = availableWeeks.find((w) => {
        const start = new Date(w.start_date);
        const end = new Date(w.end_date);
        return targetDate >= start && targetDate <= end;
      });

      if (containingWeek) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-gray-50 text-center">
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter text-gray-800">
              Chart Not Found
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
              The date you entered falls under the chart week ending on{" "}
              <strong>{containingWeek.end_date}</strong>.
            </p>
            <Link
              href={`/?week=${containingWeek.end_date}`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold uppercase text-sm hover:bg-blue-700 transition-colors"
            >
              View Week of {containingWeek.end_date}
            </Link>
          </div>
        );
      } else {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white text-center">
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter text-gray-400">
              Date Out of Range
            </h1>
            <Link
              href="/"
              className="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
            >
              Return to Current Chart
            </Link>
          </div>
        );
      }
    }
  }

  const { data: entries } = await supabase
    .from("chart_entries")
    .select(
      `
      *,
      songs (
        title,
        artists ( id, name ),
        albums ( id, title, cover_url )
      )
    `,
    )
    .eq("week_id", activeWeek.id)
    .lte("rank", 100)
    .order("rank", { ascending: true });

  return (
    <ChartView
      entries={entries}
      availableWeeks={availableWeeks.map((w) => w.end_date)}
      activeWeekDate={activeWeek.end_date}
      formattedDateRange={formatDateRange(
        activeWeek.start_date,
        activeWeek.end_date,
      )}
    />
  );
}
