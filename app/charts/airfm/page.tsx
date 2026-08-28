import Link from "next/link";
import { getChartEntriesByWeekId, getAllChartWeeks } from "@/lib/db/charts";
import { Signal, Wifi, Radar } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import WeekSelector from "../../components/WeekSelector";

type AirFMPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function AirFMPage({ searchParams }: AirFMPageProps) {
  const resolvedParams = await searchParams;
  const selectedWeekStr = resolvedParams?.week;

  const allWeeks = await getAllChartWeeks();
  const historicalWeeks = allWeeks.filter((w, idx) => idx > 0);

  let targetWeek = historicalWeeks.find((w) => w.start_date === selectedWeekStr);
  if (!targetWeek) {
    targetWeek = historicalWeeks[0] || allWeeks[0];
  }

  if (!targetWeek) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white font-geist flex items-center justify-center font-bold">
        No completed chart week found.
      </div>
    );
  }

  const rawEntries = await getChartEntriesByWeekId(targetWeek.id, 50);

  const airfmEntries = rawEntries.map((entry) => {
    const song = entry.songs;
    const title = song?.display_title || song?.title || "Unknown Title";
    const artistName = song?.artists?.name || "Unknown Artist";

    const seedString = `${title}|${artistName}`;
    const units = calculateDetailedUnits(
      entry.streams || 0,
      entry.sales || 0,
      entry.airplay || 0,
      seedString,
    );

    return {
      ...entry,
      calculatedUnits: units,
    };
  });

  airfmEntries.sort((a, b) => b.calculatedUnits.airplayUnits - a.calculatedUnits.airplayUnits);

  const formattedDateRange = formatDateRange(targetWeek.start_date, targetWeek.end_date);

  const baseFreq = Math.floor(Math.random() * (107 - 88 + 1)) + 88;
  const decimalFreq = Math.floor(Math.random() * 5) * 2 + 1; 
  const randomFreq = `${baseFreq}.${decimalFreq}`;

  const lat = (Math.random() * 90).toFixed(4);
  const long = (Math.random() * 180).toFixed(4);
  const dirLat = Math.random() > 0.5 ? 'N' : 'S';
  const dirLong = Math.random() > 0.5 ? 'E' : 'W';
  const randomCoords = `${lat}° ${dirLat}, ${long}° ${dirLong}`;

  const radarBlips = Array.from({ length: 12 }).map((_, i) => {
    const randomEntry = airfmEntries[Math.floor(Math.random() * airfmEntries.length)];
    const rank = airfmEntries.indexOf(randomEntry) + 1;
    
    const r = Math.sqrt(Math.random()) * 38; 
    const theta = Math.random() * 2 * Math.PI;
    const x = 50 + r * Math.cos(theta);
    const y = 50 + r * Math.sin(theta);
    
    const delay = (Math.random() * 5).toFixed(2);
    const duration = (5 + Math.random() * 5).toFixed(2);

    return { id: i, x, y, delay, duration, rank, song: randomEntry.songs };
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-geist selection:bg-blue-500 selection:text-black pb-24 overflow-x-hidden">
      <style>{`
        @keyframes radar-blip {
          0%   { opacity: 0; transform: scale(0.5); }
          5%   { opacity: 1; transform: scale(1.2); }
          10%  { opacity: 1; transform: scale(1); }
          50%  { opacity: 1; transform: scale(1); }
          60%  { opacity: 0; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .animate-radar-blip {
          opacity: 0; 
          animation: radar-blip var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
      `}</style>

      <div className="w-full bg-[#0f172a] border-b-2 border-blue-500/40 px-6 py-3 shadow-lg">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 border border-blue-500/30 font-mono text-xs text-blue-400">
              <Signal size={14} className="animate-pulse text-blue-500" />
              <span>FREQ: {randomFreq} FM</span>
            </div>
          </div>
          <div>
            <WeekSelector
              weeks={historicalWeeks}
              activeWeek={targetWeek.start_date}
              destination="/charts/airfm"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 sticky top-8 flex flex-col gap-6">
            <div className="border-2 border-blue-500 bg-[#0f172a] p-6 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.4)] relative">
              
              <div className="flex items-center justify-between border-b-2 border-blue-500/40 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-blue-500 bg-blue-600/20 text-blue-400">
                    <Radar size={22} className="animate-spin" style={{ animationDuration: "8s" }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-widest text-blue-400 uppercase font-mono">
                      Airplay Scanner
                    </h2>
                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                      Grid Coordinates: {randomCoords}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="relative w-full aspect-square bg-black/80 border border-blue-500/40 rounded-sm flex items-center justify-center overflow-hidden shadow-inner mb-6">
                
                {/* Concentric Radar Rings */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-blue-500/20 pointer-events-none" />
                <div className="absolute w-[55%] h-[55%] rounded-full border border-blue-500/30 pointer-events-none" />
                <div className="absolute w-[30%] h-[30%] rounded-full border border-blue-500/40 pointer-events-none" />
                
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-blue-500/30 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-blue-500/30 pointer-events-none" />

                {/* Sweeping Radar Line */}
                <div 
                  className="absolute w-[80%] h-[80%] rounded-full origin-center pointer-events-none animate-spin"
                  style={{
                    background: "conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0) 0deg, rgba(59, 130, 246, 0.4) 360deg)",
                    animationDuration: "4s",
                    animationTimingFunction: "linear"
                  }}
                />

                {radarBlips.map((blip) => (
                  <div 
                    key={blip.id}
                    className="absolute flex flex-col items-center animate-radar-blip"
                    style={{
                      left: `${blip.x}%`,
                      top: `${blip.y}%`,
                      "--delay": `${blip.delay}s`,
                      "--duration": `${blip.duration}s`,
                    } as React.CSSProperties}
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    <span className="bg-black/90 text-blue-300 font-mono text-[9px] px-1 border border-blue-500/50 mt-1 uppercase whitespace-nowrap">
                      #{blip.rank} {blip.song?.title}
                    </span>
                  </div>
                ))}

                <div className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
              </div>

              <div className="mt-4 text-center font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                Air.FM Broadcast Window: {formattedDateRange}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <div className="border-2 border-blue-500/50 bg-[#0f172a]/90 backdrop-blur shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              
              <div className="border-b-2 border-blue-500/40 bg-black/60 px-6 py-4 flex items-center justify-between text-xs font-black tracking-[0.2em] text-blue-400 uppercase sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <Wifi size={16} /> <span>Rotation</span>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                <table className="w-full border-collapse text-left relative">
                  <thead className="sticky top-0 bg-[#090d16] z-10 border-b border-blue-900/50 shadow-md">
                    <tr className="text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase">
                      <th className="w-16 px-4 py-3 text-center">Pos</th>
                      <th className="px-4 py-3">Broadcast Title & Artist</th>
                      <th className="px-4 py-3 text-right">Audience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-950 text-sm font-bold">
                    {airfmEntries.map((entry: any, index: number) => {
                      const song = entry.songs;
                      const title = song?.display_title || song?.title || "Unknown Title";
                      const artistName = song?.artists?.name || "Unknown Artist";
                      const coverUrl = song?.albums?.cover_url;
                      const rank = index + 1;
                      const isNewEntry = entry.weeks_on_chart === 1;
                      const airplayUnits = entry.calculatedUnits.airplayUnits;

                      return (
                        <tr key={entry.id} className="group transition-colors hover:bg-blue-950/40">
                          
                          <td className="px-4 py-4 text-center font-mono font-black text-blue-400">
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-base">#{rank}</span>
                              {isNewEntry && (
                                <span className="mt-0.5 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 shrink-0 overflow-hidden border border-blue-500/40 bg-black shadow-inner">
                                {coverUrl ? (
                                  <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600">AUD</div>
                                )}
                              </div>
                              <div className="flex flex-col truncate">
                                <Link href={`/library/song/${song?.id}`} className="truncate font-black text-white hover:text-blue-400 hover:underline text-sm">
                                  {title}
                                </Link>
                                <span className="truncate text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  {artistName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right font-mono font-black text-blue-400 text-sm">
                            {airplayUnits.toLocaleString("en-US")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
