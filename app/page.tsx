import Link from "next/link";
import { Activity, Calendar, ArrowRight, Flame, ArrowUpRight, Layers, Mic2, Headphones, Disc, Radio } from "lucide-react";
import { CHART_NAME } from "@/config/constants";
import { formatNumber, formatOrdinal, formatFullDate } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import HeroCoverPlayer from "@/app/components/home/HeroCoverPlayer";
import { getLatestNumberOneSong, getLatestTop5Songs, getCurrentYearEndTop5 } from "@/lib/db/charts";

export interface HeroLeaderData {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  totalPoints: number;
  weeksOnChart: number;
  peakStreak: number;
  movement: string;
  previewUrl?: string | null;
  streamsUnits?: number;
  salesUnits?: number;
  airplayUnits?: number;
  chartDate: string;
}

const fallbackLeader: HeroLeaderData = {
  id: "fallback-id",
  title: "Awaiting Data",
  artist: "System",
  coverUrl: "/cover.jpg",
  totalPoints: 0,
  weeksOnChart: 1,
  peakStreak: 1,
  movement: "DEBUT",
  previewUrl: null,
  streamsUnits: 0,
  salesUnits: 0,
  airplayUnits: 0,
  chartDate: "TBD",
};

function generateEditorialSummary(leader: HeroLeaderData) {
  const weeksRule =
    leader.weeksOnChart === 1
      ? "in its chart debut"
      : `for a ${formatOrdinal(leader.peakStreak)} week`;

  const streams = leader.streamsUnits ? formatNumber(leader.streamsUnits).toUpperCase() : "0";
  const airplay = leader.airplayUnits ? formatNumber(leader.airplayUnits).toUpperCase() : "0";
  const sales = leader.salesUnits ? formatNumber(leader.salesUnits).toUpperCase() : "0";

  return `${leader.artist}’s “${leader.title}” rules the ${CHART_NAME} Hot 100 ${weeksRule}. “${leader.title}” drew ${streams} official streams and ${airplay} radio airplay audience impressions, and sold ${sales} digital downloads in the tracking week ending ${leader.chartDate}.`;
}

export default async function LandingPage() {
  const [rawNumberOne, rawTop5Weekly, rawTop5YearEnd] = await Promise.all([
    getLatestNumberOneSong(),
    getLatestTop5Songs(),
    getCurrentYearEndTop5(),
  ]);

  let currentLeader: HeroLeaderData = fallbackLeader;

  if (rawNumberOne) {
    let movementStr = "(=)";
    if (!rawNumberOne.previous_rank) {
      movementStr = "DEBUT";
    } else if (rawNumberOne.previous_rank > 1) {
      movementStr = `(+${rawNumberOne.previous_rank - 1})`;
    }

    const title = rawNumberOne.songs?.display_title || rawNumberOne.songs?.title || "Unknown";
    const artist = rawNumberOne.songs?.artists?.display_name || rawNumberOne.songs?.artists?.name || "Unknown";
    const seedString = `${title}|${artist}`;
    
    const units = calculateDetailedUnits(
      rawNumberOne.streams || 0,
      rawNumberOne.sales || 0,
      rawNumberOne.airplay || 0,
      seedString
    );

    currentLeader = {
      id: rawNumberOne.song_id,
      title: title,
      artist: artist,
      album: rawNumberOne.songs?.albums?.display_title || rawNumberOne.songs?.albums?.title,
      coverUrl: rawNumberOne.songs?.albums?.cover_url || "/cover.jpg",
      totalPoints: rawNumberOne.total_points,
      weeksOnChart: rawNumberOne.weeks_on_chart,
      peakStreak: rawNumberOne.peak_streak,
      movement: movementStr,
      previewUrl: rawNumberOne.songs?.spotify_id || null,
      streamsUnits: units.streamsUnits,
      salesUnits: units.salesUnits,
      airplayUnits: units.airplayUnits,
      chartDate: formatFullDate(rawNumberOne.chart_weeks?.end_date),
    };
  }

  const editorialSummary = generateEditorialSummary(currentLeader);
  
  const top5Weekly = rawTop5Weekly.map((item) => ({
    id: item.song_id,
    rank: item.rank,
    title: item.songs?.display_title || item.songs?.title || "Unknown",
    artist: item.songs?.artists?.display_name || item.songs?.artists?.name || "Unknown Artist",
    coverUrl: item.songs?.albums?.cover_url || "/cover.jpg",
  }));

  const top5YearEnd = rawTop5YearEnd.map((item) => ({
    id: item.id,
    rank: item.rank,
    title: item.display_title || item.title || "Unknown",
    artist: item.artist_name || "Unknown Artist",
    coverUrl: item.cover_url || "/cover.jpg",
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-black selection:bg-[#B30000] selection:text-white">

      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#B30000]/5 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-blue-900/5 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-28 md:px-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-20">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black tracking-widest text-white uppercase mb-6 shadow-[3px_3px_0px_0px_rgba(179,0,0,1)]">
                <Flame size={14} className="text-[#B30000] fill-[#B30000]" />
                Official Hot 100 Leaderboard
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] leading-[0.88] font-black tracking-tighter uppercase mb-6">
                <span className="text-[#B30000]">&ldquo;{currentLeader.title}&rdquo;</span> tops this week&apos;s chart.
              </h1>

              <p className="max-w-xl text-base md:text-lg leading-relaxed font-medium text-gray-600 mb-8">
                {editorialSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              <Link
                href="/charts/weekly"
                className="group flex items-center gap-3 border-2 border-black bg-black px-6 py-4 text-xs md:text-sm font-black tracking-widest text-white uppercase shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="h-4 w-4 text-white" />
                Explore Full Hot 100
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/charts/live"
                className="group flex items-center gap-3 border-2 border-black bg-white px-6 py-4 text-xs md:text-sm font-black tracking-widest text-black uppercase shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-transform hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Activity className="h-4 w-4 text-[#B30000]" />
                Explore Midweek Live Chart
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <HeroCoverPlayer
              coverUrl={currentLeader.coverUrl}
              title={currentLeader.title}
              artist={currentLeader.artist}
              previewUrl={currentLeader.previewUrl}
              movement={currentLeader.movement}
            />

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="border border-black bg-gray-50 p-3 shadow-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Cumulative Points</span>
                <span className="text-lg font-black text-black">
                  {currentLeader.totalPoints.toLocaleString()} PTS
                </span>
              </div>
              <div className="border border-black bg-gray-50 p-3 shadow-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Weeks on Chart</span>
                <span className="text-lg font-black text-black">
                  {currentLeader.weeksOnChart} {currentLeader.weeksOnChart === 1 ? "WEEK" : "WEEKS"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {top5Weekly.length > 0 && (
          <div className="w-full border-t-2 border-black pt-12 mb-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Weekly Top 5</h2>
              <Link href="/charts/weekly" className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-[#B30000] transition-colors">
                View Full Chart <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {top5Weekly.map((song) => (
                <Link key={song.id} href={`/library/song/${song.id}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-square w-full border-2 border-black bg-zinc-100 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute top-0 left-0 flex h-9 w-9 items-center justify-center border-r-2 border-b-2 border-black bg-black text-white font-black text-lg shadow-sm">
                      {song.rank}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase truncate text-black group-hover:text-[#B30000] transition-colors">{song.title}</h4>
                    <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase truncate">{song.artist}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {top5YearEnd.length > 0 && (
          <div className="w-full border-t-2 border-black pt-12 mb-20">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{new Date().getFullYear()} Year-End Top 5</h2>
              <Link href={`/charts/year-end?year=${new Date().getFullYear()}`} className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-[#B30000] transition-colors">
                View Full Year <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {top5YearEnd.map((song) => (
                <Link key={song.id} href={`/library/song/${song.id}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-square w-full border-2 border-black bg-zinc-100 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute top-0 left-0 flex h-9 w-9 items-center justify-center border-r-2 border-b-2 border-black bg-black text-white font-black text-lg shadow-sm">
                      {song.rank}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase truncate text-black group-hover:text-[#B30000] transition-colors">{song.title}</h4>
                    <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase truncate">{song.artist}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="w-full border-t-2 border-black pt-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tighter uppercase">The Charts</h2>
            <Link href="/charts" className="hidden sm:flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-[#B30000] transition-colors">
              View All Charts <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* HOT 100 */}
            <Link href="/charts/weekly" className="group flex flex-col justify-between border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-12">
                <Calendar className="h-8 w-8 text-black" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-black" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">Hot 100</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Official Leaderboard</p>
              </div>
            </Link>

            {/* ALBUMS */}
            <Link href="/charts/albums" className="group flex flex-col justify-between border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-12">
                <Layers className="h-8 w-8 text-black" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-black" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">Top Albums 20</h3>
              </div>
            </Link>

            {/* ARTISTS */}
            <Link href="/charts/artists" className="group flex flex-col justify-between border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-12">
                <Mic2 className="h-8 w-8 text-black" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-black" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">Top Artists 20</h3>
              </div>
            </Link>

            {/* STREAMIFY */}
            <Link href="/charts/streamify" className="group flex flex-col justify-between border-2 border-black bg-[#121212] text-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-12">
                <Headphones className="h-8 w-8 text-[#1ed760]" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-gray-500 transition-colors group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">Streamify</h3>
                <p className="text-[11px] font-bold text-[#1ed760] uppercase tracking-widest">Digital Streaming Metrics</p>
              </div>
            </Link>

            {/* ISALES */}
            <Link href="/charts/isales" className="group flex flex-col justify-between border-2 border-black bg-amber-400 text-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-12">
                <Disc className="h-8 w-8 text-black" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-amber-700 transition-colors group-hover:text-black" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1">iSales</h3>
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-widest">Pure Purchases Ledger</p>
              </div>
            </Link>

            {/* AIR.FM */}
            <Link href="/charts/airfm" className="group flex flex-col justify-between border-2 border-black bg-[#090d16] text-blue-400 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-12">
                <Radio className="h-8 w-8 text-blue-500" strokeWidth={2.5} />
                <ArrowUpRight className="h-5 w-5 text-blue-800 transition-colors group-hover:text-blue-400" />
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-1 text-white">Air.FM</h3>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Radio Rotation Scanner</p>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </main>
  );
}
