import { getAllChartWeeks } from "@/lib/db/charts";
import { formatFullDate, formatShortDate } from "@/utils/formatters";
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

  const currentWeek = resolvedParams.week || pastWeeksData[0]?.start_date;
  const formattedDate = formatFullDate(currentWeek);

  return (
    <main className="min-h-screen bg-white pb-24 text-gray-900">
      
      <div className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-7xl px-8 py-12 md:py-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-gray-300 pb-8">
            <div className="inline-flex items-center gap-2 rounded-sm bg-red-50 px-3 py-1 text-[10px] font-bold tracking-widest text-red-600 uppercase">
            </div>
            
            <ArticleWeekSelector availableWeeks={pastWeeksData} currentWeek={currentWeek} />
          </div>

          <h1 className="mb-6 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl lg:text-[5.5rem]">
            The {CHART_NAME} Breakdown: Week of {formatShortDate(currentWeek)}
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
                <div className="flex flex-row gap-3">
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
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">The Top 10</li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">Biggest Debuts</li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">Movers & Shakers</li>
                  <li className="cursor-pointer transition-colors hover:text-[#B30000]">Methodology Notes</li>
                </ul>
              </div>

            </div>
          </aside>

          <article className="lg:col-span-7">
            <div className="prose prose-lg max-w-none font-serif text-gray-800 prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-h2:text-4xl prose-h3:text-2xl prose-a:font-bold prose-a:text-[#B30000]">
              
              <p className="lead text-2xl leading-relaxed text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
              </p>

              <h2>The Battle for Number One</h2>
              
              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
              </p>

              <p>
                Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
              </p>

              <h3>Biggest Debuts</h3>

              <p>
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
              </p>

              <p>
                Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
              </p>

            </div>
          </article>
          
          <aside className="lg:col-span-3">
            <div className="sticky top-12">
              <span className="mb-6 block border-b-4 border-black pb-2 text-lg font-black tracking-tighter uppercase">
                More News
              </span>
              
              <div className="flex flex-col gap-6">
                
                {/* Mockup Sidebar Card 1 */}
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

                {/* Mockup Sidebar Card 2 */}
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

                {/* Mockup Sidebar Card 3 */}
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
