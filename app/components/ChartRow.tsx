"use client";

import { useState, useRef } from "react";
import ChartTicket from "./ChartTicket";
import Link from "next/link";
import { Share2, Ticket, X, LineChart, Download } from "lucide-react";
import { toPng } from "html-to-image";

export const formatNumber = (num: number) => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

export const getStableSeed = (seedString?: string) => {
  if (!seedString) return 0;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash += (i + 1) * seedString.charCodeAt(i);
  }
  return hash;
};

export const applyDeviation = (
  base: number,
  seed: number,
  scale = 0.1,
  mod = 100,
) => {
  const deviation = ((seed % mod) / mod - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};

export type MaxStats = {
  sales: number;
  streams: number;
  airplay: number;
  units: number;
};

export type DisplayEntry = {
  id: string;
  rank: number;
  previousRank: number | null;
  
  coverUrl: string | null;
  primaryText: string;
  primaryHref: string | null;
  secondaryText: string | null;
  secondaryHref: string | null;
  
  mathSeedString: string;
  disableDropdown?: boolean;
  hideRankChange?: boolean;
  
  isNewPeak: boolean;
  isRePeak: boolean;
  peakPosition: number;
  peakStreak: number | null;
  weeksOnChart: number;
  totalPoints: number;
  currentWeekPoints: number;
  previousWeekRawPoints: number | null;
  twoWeeksAgoRawPoints: number | null;
  sales: number;
  streams: number;
  airplay: number;
};

export default function ChartRow({
  entry,
  maxStats,
  week,
}: {
  entry: DisplayEntry;
  maxStats: MaxStats;
  week: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${entry.primaryText.replace(/\s+/g, "-")}-Hot100.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export ticket", err);
    } finally {
      setIsExporting(false);
    }
  };

  const seed = getStableSeed(entry.mathSeedString);
  const streamsUnits = applyDeviation(Math.floor(entry.streams * 5250 * 275), seed + 1);
  const salesUnits = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
  const airplayUnits = applyDeviation(Math.floor(entry.airplay * 2250 * 5020), seed + 3);
  const totalUnits = applyDeviation(
    Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
    seed + 4,
  );

  const prevRaw = entry.previousWeekRawPoints || 0;
  const twoWeeksRaw = entry.twoWeeksAgoRawPoints || 0;
  const totalRawForPct = entry.streams * 4 + entry.sales * 0.45 + entry.airplay * 5;

  const streamsPct = totalRawForPct > 0 ? Math.round(((entry.streams * 4) / totalRawForPct) * 100) + "%" : "0%";
  const salesPct = totalRawForPct > 0 ? Math.round(((entry.sales * 0.45) / totalRawForPct) * 100) + "%" : "0%";
  const airplayPct = totalRawForPct > 0 ? Math.round(((entry.airplay * 5) / totalRawForPct) * 100) + "%" : "0%";

  let pointsPctStr = "--";
  if (prevRaw > 0) {
    const pctChange = ((entry.totalPoints - prevRaw) / prevRaw) * 100;
    pointsPctStr = (pctChange > 0 ? "+" : "") + Math.round(pctChange);
  }

  let status = "none";
  let rankChange = 0;
  
  if (!entry.hideRankChange) {
    if (!entry.previousRank) {
      status = entry.weeksOnChart > 1 ? "re" : "new";
    } else if (entry.previousRank > entry.rank) {
      status = "rise";
      rankChange = entry.previousRank - entry.rank;
    } else if (entry.previousRank < entry.rank) {
      status = "fall";
      rankChange = entry.rank - entry.previousRank;
    } else {
      status = "stable";
    }
  }
  
  const isTopSales = salesUnits > 0 && salesUnits === maxStats.sales;
  const isTopStreams = streamsUnits > 0 && streamsUnits === maxStats.streams;
  const isTopAirplay = airplayUnits > 0 && airplayUnits === maxStats.airplay;
  const isTopUnits = totalUnits > 0 && totalUnits === maxStats.units;

  let peakBgClass = "bg-blue-50/50";
  let streakColorClass = "text-gray-400";
  if (entry.isNewPeak) {
    peakBgClass = "bg-[#ffe49a]";
    streakColorClass = "text-[#7e3d01]";
  } else if (entry.isRePeak) {
    peakBgClass = "bg-[#cdecff]";
    streakColorClass = "text-[#024da0]";
  }

  return (
    <div className="flex flex-col border-b border-gray-100 group">
      {/* THE MAIN ROW */}
      <div
        onClick={() => !entry.disableDropdown && setIsExpanded(!isExpanded)}
        className={`grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center h-14 transition-colors ${
          entry.disableDropdown ? "cursor-default" : "cursor-pointer"
        } ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
      >
        <div className="font-black text-xl text-center text-gray-800">{entry.rank}</div>

        <div className="text-center font-bold text-xs">
          {entry.hideRankChange ? (
            <span className="text-gray-300">-</span>
          ) : (
            <>
              {status === "re" && <span className="text-[#8e0be5] bg-purple-50 px-1 rounded">RE</span>}
              {status === "new" && <span className="text-[#05a7e5] bg-blue-50 px-1 rounded">NEW</span>}
              {status === "stable" && <span className="text-black text-xl leading-none">=</span>}
              {status === "rise" && <span className="text-green-600">+{rankChange}</span>}
              {status === "fall" && <span className="text-red-500">-{rankChange}</span>}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 overflow-hidden py-1">
          <div className="w-10 h-10 bg-gray-200 shrink-0 shadow-sm relative block">
            {entry.coverUrl && (
              <img src={entry.coverUrl} className="w-full h-full object-cover" loading="lazy" alt="Cover" />
            )}
          </div>
          
          <div className="truncate pr-4 flex flex-col justify-center">
            {entry.primaryHref ? (
              <Link
                href={entry.primaryHref}
                className="font-bold leading-tight truncate text-gray-900 hover:text-blue-600 transition-colors block"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.primaryText}
              </Link>
            ) : (
              <div className="font-bold leading-tight truncate text-gray-900 block">
                {entry.primaryText}
              </div>
            )}

            {entry.secondaryText && (
              entry.secondaryHref ? (
                <Link
                  href={entry.secondaryHref}
                  className="text-xs text-gray-500 hover:text-blue-600 hover:underline truncate font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entry.secondaryText}
                </Link>
              ) : (
                <div className="text-xs text-gray-500 truncate font-medium">
                  {entry.secondaryText}
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-center h-full" />

        <div className="text-center font-bold text-gray-700">{formatNumber(entry.totalPoints)}</div>
        <div className="flex justify-center">
          {pointsPctStr === "--" ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">--</span>
          ) : (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pointsPctStr.includes("-") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {pointsPctStr}%
            </span>
          )}
        </div>

        <div className={`text-center h-full flex flex-col justify-center border-l border-white ${peakBgClass}`}>
          <div className="font-bold leading-none text-gray-700">
            {entry.peakPosition === 101 ? "--" : entry.peakPosition}
          </div>
          {entry.peakStreak && (
            <div className={`text-[9px] ${streakColorClass} font-bold uppercase mt-0.5`}>{entry.peakStreak}x</div>
          )}
        </div>
        <div className="text-center text-gray-400 font-medium text-xs">{entry.weeksOnChart}</div>

        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopSales ? "bg-[#f8e285] font-bold" : "bg-[#fff0ad] font-medium"}`}>
          {formatNumber(salesUnits)}
        </div>
        <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#fff0ad]">
          {salesPct}
        </div>

        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopStreams ? "bg-[#bcf08e] font-bold" : "bg-[#d5f7bb] font-medium"}`}>
          {formatNumber(streamsUnits)}
        </div>
        <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#d5f7bb]">
          {streamsPct}
        </div>

        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopAirplay ? "bg-[#9adafe] font-bold" : "bg-[#b4e3ff] font-medium"}`}>
          {formatNumber(airplayUnits)}
        </div>
        <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#b4e3ff]">
          {airplayPct}
        </div>

        <div className={`text-center h-full flex items-center justify-center border-l border-white text-purple-900 ${isTopUnits ? "bg-[#dcace8] font-bold" : "bg-[#e7d6ff] font-bold"}`}>
          {formatNumber(totalUnits)}
        </div>
      </div>

      {/* THE DROPDOWN PANEL */}
      {isExpanded && !entry.disableDropdown && (
        <div className="bg-white border-t border-gray-100 px-8 py-5 text-sm shadow-inner overflow-hidden cursor-default">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Scores
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Streams:</span> <span className="font-mono">{formatNumber(entry.streams)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Sales:</span> <span className="font-mono">{formatNumber(entry.sales)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Airplay:</span> <span className="font-mono">{formatNumber(entry.airplay)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Points
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Streams:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">{formatNumber(entry.streams)} x 5 = </span>
                  <span className="text-gray-800">{formatNumber(entry.streams * 5)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Sales:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">{formatNumber(entry.sales)} x 3 = </span>
                  <span className="text-gray-800">{formatNumber(entry.sales * 3)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Airplay:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">{formatNumber(entry.airplay)} x 2 = </span>
                  <span className="text-gray-800">{formatNumber(entry.airplay * 2)}</span>
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Decay
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>This week:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(entry.streams * 5)} + {formatNumber(entry.sales * 3)} + {formatNumber(entry.airplay * 2)} =
                  </span>
                  <span className="text-gray-800 ml-1">{formatNumber(entry.currentWeekPoints)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>One week ago:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(entry.previousWeekRawPoints || 0)} x 30% =
                  </span>
                  <span className="text-gray-800 ml-1">
                    {formatNumber(Math.floor((entry.previousWeekRawPoints || 0) * 0.3))}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Two weeks ago:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(entry.twoWeeksAgoRawPoints || 0)} x 20% =
                  </span>
                  <span className="text-gray-800 ml-1">
                    {formatNumber(Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2))}
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col justify-center items-center">
              <span className="font-bold text-blue-800 text-xs uppercase mb-1">Total Points</span>
              <span className="text-4xl font-black text-blue-900 tracking-tighter leading-none mb-1">
                {formatNumber(entry.totalPoints)}
              </span>
              <span className="text-[12px] text-blue-600/70 font-mono font-bold tracking-tight">
                {formatNumber(entry.currentWeekPoints)} +{" "}
                {formatNumber(Math.floor((entry.previousWeekRawPoints || 0) * 0.3))} +{" "}
                {formatNumber(Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2))}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-gray-500" />
              Share & Export
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 h-[100px] flex items-center justify-center italic text-xs">
                News Feed placeholders go here
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 h-[100px] flex items-center justify-center italic text-xs">
                Copy-pastable caption placeholder
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2.5 text-sm shadow"
                >
                  <Ticket className="w-5 h-5" />
                  View Chart Ticket
                </button>
                <Link
                  href={entry.primaryHref || "#"}
                  className="bg-white text-gray-900 font-bold py-2.5 px-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 text-sm shadow-sm"
                >
                  <LineChart className="w-5 h-5 text-gray-500" />
                  View All-Time Stats
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 shadow-xl flex flex-col gap-6">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex justify-between items-end pr-8">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Chart Ticket</h2>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Rendering..." : "Download High-Res PNG"}
              </button>
            </div>

            <div className="w-full flex justify-center bg-gray-50 rounded-xl p-4 overflow-x-auto border border-gray-200">
              <div ref={ticketRef} className="bg-[#f9fafb] p-8 flex flex-col gap-6 rounded-xl shrink-0 w-[800px]">
                <div className="flex justify-between items-center text-white/50 px-2">
                  <span className="font-bold tracking-widest text-gray-600 text-sm uppercase">Personal Hot 100</span>
                  <span className="font-bold text-xs text-gray-600">Chart dated {week}</span>
                </div>

                <ChartTicket entry={entry} />

                <div className="flex justify-between items-center text-gray-400 text-xs px-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3 h-3" />
                    {entry.id.split("-")[0]}
                  </span>
                  <span className="tracking-widest text-gray-600 uppercase">
                    {entry.secondaryText || "Artist Data"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
