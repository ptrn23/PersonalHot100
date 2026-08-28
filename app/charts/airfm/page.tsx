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
      <div className="font-geist flex min-h-screen items-center justify-center bg-[#090d16] font-bold text-white">
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
  const dirLat = Math.random() > 0.5 ? "N" : "S";
  const dirLong = Math.random() > 0.5 ? "E" : "W";
  const randomCoords = `${lat}° ${dirLat}, ${long}° ${dirLong}`;

  const radarBlips = Array.from({ length: 12 }).map((_, i) => {
    const randomEntry = airfmEntries[Math.floor(Math.random() * airfmEntries.length)];
    const rank = airfmEntries.indexOf(randomEntry) + 1;

    const r = Math.sqrt(Math.random()) * 38;
    const theta = Math.random() * 2 * Math.PI;
    const x = 50 + r * Math.cos(theta);
    const y = 50 + r * Math.sin(theta);

    const delay = (Math.random() * 30).toFixed(2);
    const duration = (20 + Math.random() * 10).toFixed(2);

    return { id: i, x, y, delay, duration, rank, song: randomEntry.songs };
  });

  return (
    <div className="font-geist min-h-screen overflow-x-hidden bg-[#090d16] pb-24 text-white selection:bg-blue-500 selection:text-black">
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

      <div className="w-full border-b-2 border-blue-500/40 bg-[#0f172a] px-6 py-3 shadow-lg">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="mt-1 text-2xl font-black tracking-tighter text-white uppercase md:text-5xl">
              Air.FM Global Top 50
            </h1>
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
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="sticky top-8 flex flex-col gap-6 lg:col-span-5">
            <div className="relative border-2 border-blue-500 bg-[#0f172a] p-6 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.4)]">
              <div className="mb-6 flex items-center justify-between border-b-2 border-blue-500/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-blue-500 bg-blue-600/20 text-blue-400">
                    <Radar size={22} className="animate-spin" style={{ animationDuration: "8s" }} />
                  </div>
                  <div>
                    <h2 className="font-mono text-sm font-black tracking-widest text-blue-400 uppercase">
                      Airplay Scanner
                    </h2>
                    <span className="font-mono text-[10px] text-gray-400 uppercase">
                      Grid Coordinates: {randomCoords}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border border-blue-500/30 bg-black/60 px-3 py-1 font-mono text-xs text-blue-400">
                  <Signal size={14} className="animate-pulse text-blue-500" />
                  <span>FREQ: {randomFreq} FM</span>
                </div>
              </div>

              <div className="relative mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-sm border border-blue-500/40 bg-black/80 shadow-inner">
                {/* Concentric Radar Rings */}
                <div className="pointer-events-none absolute h-[80%] w-[80%] rounded-full border border-blue-500/20" />
                <div className="pointer-events-none absolute h-[55%] w-[55%] rounded-full border border-blue-500/30" />
                <div className="pointer-events-none absolute h-[30%] w-[30%] rounded-full border border-blue-500/40" />

                {/* Crosshairs */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1px] bg-blue-500/30" />
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[1px] bg-blue-500/30" />

                {/* Sweeping Radar Line */}
                <div
                  className="pointer-events-none absolute h-[80%] w-[80%] origin-center animate-spin rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0) 0deg, rgba(59, 130, 246, 0.4) 360deg)",
                    animationDuration: "4s",
                    animationTimingFunction: "linear",
                  }}
                />

                {radarBlips.map((blip) => (
                  <div
                    key={blip.id}
                    className="animate-radar-blip absolute flex flex-col items-center"
                    style={
                      {
                        left: `${blip.x}%`,
                        top: `${blip.y}%`,
                        "--delay": `${blip.delay}s`,
                        "--duration": `${blip.duration}s`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    <span className="mt-1 border border-blue-500/50 bg-black/90 px-1 font-mono text-[9px] whitespace-nowrap text-blue-300 uppercase">
                      #{blip.rank} {blip.song?.title}
                    </span>
                  </div>
                ))}

                <div className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
              </div>

              <div className="mt-4 text-center font-mono text-[10px] tracking-widest text-gray-500 uppercase">
                Air.FM Broadcast Window: {formattedDateRange}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden border-2 border-blue-500/50 bg-[#0f172a]/90 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] backdrop-blur">
              <div className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-blue-500/40 bg-black/60 px-6 py-4 text-xs font-black tracking-[0.2em] text-blue-400 uppercase">
                <div className="flex items-center gap-2">
                  <Wifi size={16} /> <span>Rotation</span>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                <table className="relative w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 border-b border-blue-900/50 bg-[#090d16] shadow-md">
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
                                <span className="py-0.2 mt-0.5 bg-blue-600 px-1.5 text-[9px] font-black tracking-wider text-white uppercase">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 shrink-0 overflow-hidden border border-blue-500/40 bg-black shadow-inner">
                                {coverUrl ? (
                                  <img
                                    src={coverUrl}
                                    alt={title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600">
                                    AUD
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col truncate">
                                <Link
                                  href={`/library/song/${song?.id}`}
                                  className="truncate text-sm font-black text-white hover:text-blue-400 hover:underline"
                                >
                                  {title}
                                </Link>
                                <span className="truncate text-xs font-bold tracking-wider text-gray-400 uppercase">
                                  {artistName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-right font-mono text-sm font-black text-blue-400">
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
