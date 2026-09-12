import { getAllChartWeeks, getChartEntriesByWeekId } from "@/lib/db/charts";
import { formatFullDate, formatShortDate, formatNumber, formatOrdinal } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import ArticleWeekSelector from "../../components/ArticleWeekSelector";
import { CHART_NAME } from "@/config/constants";
import { Link2, Bookmark, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedParams = await searchParams;
  
  const rawWeeksData = await getAllChartWeeks();
  const pastWeeksData = rawWeeksData.slice(1);

  // Determine the active week based on URL or fallback to the most recent past week
  const currentWeekStr = resolvedParams.week || pastWeeksData[0]?.start_date;
  const targetWeek = pastWeeksData.find((w) => w.start_date === currentWeekStr) || pastWeeksData[0];
  const formattedDate = formatFullDate(targetWeek.start_date);

  // Fetch the chart entries for this specific week
  const rawEntries = await getChartEntriesByWeekId(targetWeek.id, 100);
  
  // Safely extract the #1 song and artist
  const numberOneEntry = rawEntries?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const songData = Array.isArray(numberOneEntry?.songs) ? numberOneEntry.songs[0] : (numberOneEntry?.songs as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artistData = Array.isArray(songData?.artists) ? songData.artists[0] : (songData?.artists as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumData = Array.isArray(songData?.albums) ? songData.albums[0] : (songData?.albums as any);
  
  const no1Title = songData?.display_title || songData?.title || "Unknown Song";
  const no1Artist = artistData?.display_name || artistData?.name || "Unknown Artist";

  // Safely extract the #2 song for the dynamic outline
  const numberTwoEntry = rawEntries?.[1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const songData2 = Array.isArray(numberTwoEntry?.songs) ? numberTwoEntry.songs[0] : (numberTwoEntry?.songs as any);
  const no2Title = songData2?.display_title || songData2?.title || "Unknown Song";
  
  // Get the best available cover image
  const singleCoverUrl = songData?.cover_url_single;
  const albumCoverUrl = albumData?.cover_url;
  const activeCoverUrl = singleCoverUrl || albumCoverUrl;
  const coverType = singleCoverUrl ? "Single Art" : "Album Art";

  // Calculate the detailed units and streak for the opening paragraph
  const { streamsUnits, salesUnits, airplayUnits } = calculateDetailedUnits(
    numberOneEntry?.streams || 0,
    numberOneEntry?.sales || 0,
    numberOneEntry?.airplay || 0,
    `${no1Title}|${no1Artist}`
  );
  
  const no1Streak = formatOrdinal(numberOneEntry?.peak_streak || 1);
  const trackingEndDate = formatFullDate(targetWeek.end_date);

  return (
    <main className="min-h-screen bg-white pb-24 text-gray-900">
      
      <div className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-7xl px-8 py-12 md:py-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-gray-300 pb-8">
            <ArticleWeekSelector availableWeeks={pastWeeksData} currentWeek={targetWeek.start_date} />
          </div>

          <h1 className="mb-6 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl lg:text-[5.5rem]">
            &ldquo;{no1Title}&rdquo; tops this week&apos;s chart for a {no1Streak} week.
          </h1>
          
          <div className="flex items-center gap-4 text-sm font-bold tracking-widest text-gray-500 uppercase">
            <span>By So Casual Charts</span>
            <span className="text-gray-300">|</span>
            <span className="text-[#B30000]">Published: {formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          <aside className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-12 flex flex-col gap-8">
              
              <div>
                <span className="mb-4 block border-b-2 border-black pb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Share
                </span>
                <div className="flex flex-row flex-wrap gap-3">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-black hover:bg-black hover:text-white">
                    <Link2 size={18} />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#B30000] hover:bg-[#B30000] hover:text-white">
                    <Bookmark size={18} />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              <div>
                <span className="mb-4 block border-b-2 border-black pb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  In This Edition
                </span>
                <ul className="flex flex-col gap-3 text-sm font-bold text-gray-700">
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">
                    &lsquo;{no1Title}&rsquo; Streams, Airplay & Sales
                  </li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">
                    Rest of Top 10: &lsquo;{no2Title}&rsquo; & More
                  </li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">Hot Debuts</li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">Re-entries</li>
                </ul>
              </div>

            </div>
          </aside>

          <article className="lg:col-span-7">
            <div className="prose prose-lg max-w-none font-serif text-gray-800 prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-h2:text-4xl prose-h3:text-2xl prose-a:font-bold prose-a:text-[#B30000]">
              
              <figure className="not-prose mb-10 w-full">
                <div className="aspect-[1/1] w-full overflow-hidden border-2 border-black bg-gray-100 shadow">
                  {activeCoverUrl ? (
                    <img 
                      src={activeCoverUrl} 
                      alt={`Cover artwork for ${no1Title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                      No Artwork Available
                    </div>
                  )}
                </div>
                <figcaption className="mt-4 border-l-4 border-[#B30000] pl-4 text-xs font-bold text-gray-500">
                  Pictured: {coverType} for &ldquo;{no1Title}&rdquo; by {no1Artist}.
                </figcaption>
              </figure>

              <h2 className="mt-12 mb-6 border-b-4 border-black pb-3 font-[family-name:Geist] text-4xl leading-none font-black tracking-tighter text-black uppercase">
                &lsquo;{no1Title}&rsquo; Streams, Airplay & Sales
              </h2>

              <p className="lead mt-0 text-2xl leading-relaxed text-black">
                {no1Artist}&apos;s &ldquo;{no1Title}&rdquo; rules the {CHART_NAME} Hot 100 for a {no1Streak} week. &ldquo;{no1Title}&rdquo; drew {formatNumber(streamsUnits).toUpperCase()} official streams and {formatNumber(airplayUnits).toUpperCase()} radio airplay audience impressions, and sold {formatNumber(salesUnits).toUpperCase()} digital downloads in the tracking week ending {trackingEndDate}.
              </p>

            </div>
          </article>
          
          <aside className="lg:col-span-3">
            <div className="sticky top-12">
              <span className="mb-6 block border-b-4 border-black pb-2 text-lg font-black tracking-tighter uppercase">
                More News
              </span>
              
              <div className="flex flex-col gap-6">
                
                <div className="group cursor-pointer border-b border-gray-200 pb-6">
                  <p className="mb-2 text-xs font-bold tracking-widest text-[#B30000] uppercase">
                    Milestones
                  </p>
                  <h4 className="mb-2 text-lg leading-tight font-black uppercase transition-colors group-hover:text-[#B30000]">
                    Detroit: Become Human OST Surpasses 1B Total Chart Points
                  </h4>
                  <p className="text-sm text-gray-500 font-serif">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                  </p>
                </div>

                <div className="group cursor-pointer border-b border-gray-200 pb-6">
                  <p className="mb-2 text-xs font-bold tracking-widest text-[#B30000] uppercase">
                    Records
                  </p>
                  <h4 className="mb-2 text-lg leading-tight font-black uppercase transition-colors group-hover:text-[#B30000]">
                    Taylor Swift Ties Record for Most Simultaneous Top 10 Hits
                  </h4>
                  <p className="text-sm text-gray-500 font-serif">
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
                  </p>
                </div>

                <div className="group cursor-pointer">
                  <p className="mb-2 text-xs font-bold tracking-widest text-[#B30000] uppercase">
                    Chart Mechanics
                  </p>
                  <h4 className="mb-2 text-lg leading-tight font-black uppercase transition-colors group-hover:text-[#B30000]">
                    How the New Stream Weighting Affects Catalog Tracks
                  </h4>
                  <p className="text-sm text-gray-500 font-serif">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.
                  </p>
                </div>

              </div>
            </div>
          </aside>

        </div>
      </div>
      
    </main>
  );
}
