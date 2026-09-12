import { getAllChartWeeks } from "@/lib/db/charts";
import { formatFullDate, formatShortDate } from "@/utils/formatters";
import ArticleWeekSelector from "../../components/ArticleWeekSelector";
import { CHART_NAME } from "@/config/constants";

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedParams = await searchParams;
  
  const rawWeeksData = await getAllChartWeeks();
  const pastWeeksData = rawWeeksData.slice(1);

  const currentWeek = resolvedParams.week || pastWeeksData[0]?.start_date;
  const formattedDate = formatFullDate(currentWeek);

  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-24 text-gray-900">
      
      <div className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-4xl px-8 py-12 md:py-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-gray-300 pb-8">
            <div className="inline-flex items-center gap-2 rounded-sm bg-red-50 px-3 py-1 text-[10px] font-bold tracking-widest text-red-600 uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Chart Review
            </div>
            
            <ArticleWeekSelector availableWeeks={pastWeeksData} currentWeek={currentWeek} />
          </div>

          <h1 className="mb-4 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
            The {CHART_NAME} Breakdown: Week of {formatShortDate(currentWeek)}
          </h1>
          
          <div className="flex items-center gap-4 text-sm font-bold tracking-widest text-gray-500 uppercase">
            <span>By So Casual Charts</span>
            <span className="text-gray-300">|</span>
            <span className="text-[#B30000]">Published: {formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-4xl px-8">
        <article className="font-serif prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-a:text-[#B30000] prose-a:font-bold">
          <p>Lorem ipsum.</p>  
        </article>
      </div>
      
    </main>
  );
}
