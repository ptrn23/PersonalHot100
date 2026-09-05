import Link from "next/link";
import { Activity, Calendar, ArrowRight, Flame } from "lucide-react";
import { CHART_NAME } from "@/config/constants";
import { formatNumber, formatOrdinal } from "@/utils/formatters";
import HeroCoverPlayer from "@/app/components/home/HeroCoverPlayer";

export interface HeroLeaderData {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  totalPoints: number;
  weeksOnChart: number;
  movement: string;
  previewUrl?: string | null;
  streamsUnits?: number;
  salesUnits?: number;
  airplayUnits?: number;
  chartDate: string;
}

// PLACEHOLDER
const mockLeaderData: HeroLeaderData = {
  id: "song-sample-id",
  title: "The Fate of Ophelia",
  artist: "Taylor Swift",
  album: "The Life of a Showgirl",
  coverUrl: "https://lastfm-img.freetls.fastly.net/i/u/300x300/837e4d37b0c4a0a65eb12177e1afb8ee.png",
  totalPoints: 807,
  weeksOnChart: 10,
  movement: "(=)",
  previewUrl: "https://p.scdn.co/mp3-preview/https://open.spotify.com/track/53iuhJlwXhSER5J2IYYv1W?si=56ed88eb68f4419f",
  streamsUnits: 18400000,
  airplayUnits: 62100000,
  salesUnits: 11000,
  chartDate: "September 4, 2026",
};

function generateEditorialSummary(leader: HeroLeaderData) {
  const weeksRule =
    leader.weeksOnChart === 1
      ? "in its chart debut"
      : `for a ${formatOrdinal(leader.weeksOnChart)} consecutive week`;

  const metricsBreakdown: string[] = [];
  if (leader.streamsUnits) {
    metricsBreakdown.push(`${formatNumber(leader.streamsUnits).toUpperCase()} streams`);
  }
  if (leader.airplayUnits) {
    metricsBreakdown.push(`${formatNumber(leader.airplayUnits).toUpperCase()} radio audience impressions`);
  }
  if (leader.salesUnits) {
    metricsBreakdown.push(`${formatNumber(leader.salesUnits).toUpperCase()} digital downloads`);
  }

  const breakdownStr =
    metricsBreakdown.length > 0 ? `, propelled by ${metricsBreakdown.join(", ")}` : "";

  return `${leader.artist}’s “${leader.title}” rules the ${CHART_NAME} Hot 100 ${weeksRule}. “The Fate of Ophelia” drew 18.4 million official streams (up 1% week-over-week) and 62.1 million radio airplay audience impressions (up 2%) and sold 11,000 (down 63%) in the United States Dec. 26-Jan. 1.`;
}

export default async function LandingPage() {
  // const currentLeader = await getHomepageLeader();
  const currentLeader: HeroLeaderData = mockLeaderData;
  const editorialSummary = generateEditorialSummary(currentLeader);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-black selection:bg-[#B30000] selection:text-white">

      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#B30000]/5 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-blue-900/5 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-28 md:px-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black tracking-widest text-white uppercase mb-6 shadow-[3px_3px_0px_0px_rgba(179,0,0,1)]">
                <Flame size={14} className="text-[#B30000] fill-[#B30000]" />
                Official Hot 100 Leaderboard
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] leading-[0.88] font-black tracking-tighter uppercase mb-6">
                &ldquo;{currentLeader.title}&rdquo; tops this week&apos;s chart.
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
                Live Tracking Room
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
      </div>
    </main>
  );
}
