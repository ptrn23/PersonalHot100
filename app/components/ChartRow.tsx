"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatNumber,
  getStableSeed,
  applyDeviation,
} from "../utils/chartMath";
import ChartRowDropdown from "./ChartRowDropdown";
import ChartTicketModal from "./ChartTicketModal";

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
  isOut?: boolean;

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

  const seed = getStableSeed(entry.mathSeedString);
  const streamsUnits = applyDeviation(
    Math.floor(entry.streams * 5250 * 275),
    seed + 1,
  );
  const salesUnits = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
  const airplayUnits = applyDeviation(
    Math.floor(entry.airplay * 2250 * 5020),
    seed + 3,
  );
  const totalUnits = applyDeviation(
    Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
    seed + 4,
  );

  const prevRaw = entry.previousWeekRawPoints || 0;
  const twoWeeksRaw = entry.twoWeeksAgoRawPoints || 0;
  const totalRawForPct =
    entry.streams * 4 + entry.sales * 0.45 + entry.airplay * 5;

  const streamsPct =
    totalRawForPct > 0
      ? Math.round(((entry.streams * 4) / totalRawForPct) * 100) + "%"
      : "0%";
  const salesPct =
    totalRawForPct > 0
      ? Math.round(((entry.sales * 0.45) / totalRawForPct) * 100) + "%"
      : "0%";
  const airplayPct =
    totalRawForPct > 0
      ? Math.round(((entry.airplay * 5) / totalRawForPct) * 100) + "%"
      : "0%";

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
      <div
        onClick={() => !entry.disableDropdown && setIsExpanded(!isExpanded)}
        className={`grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center h-14 transition-colors ${
          entry.disableDropdown ? "cursor-default" : "cursor-pointer"
        } ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
      >
        <div className="font-black text-xl text-center text-gray-800">
          {entry.isOut ? "-" : entry.rank}
        </div>

        <div className="text-center font-bold text-xs">
          {entry.hideRankChange ? (
            <span className="text-gray-300">-</span>
          ) : entry.isOut ? (
            <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
              OUT
            </span>
          ) : (
            <>
              {status === "re" && (
                <span className="text-[#8e0be5] bg-purple-50 px-1 rounded">
                  RE
                </span>
              )}
              {status === "new" && (
                <span className="text-[#05a7e5] bg-blue-50 px-1 rounded">
                  NEW
                </span>
              )}
              {status === "stable" && (
                <span className="text-black text-xl leading-none">=</span>
              )}
              {status === "rise" && (
                <span className="text-green-600">+{rankChange}</span>
              )}
              {status === "fall" && (
                <span className="text-red-500">-{rankChange}</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 overflow-hidden py-1">
          <div className="w-10 h-10 bg-gray-200 shrink-0 shadow-sm relative block">
            {entry.coverUrl && (
              <img
                src={entry.coverUrl}
                className={`w-full h-full object-cover transition-all ${
                  entry.isOut ? "grayscale opacity-80" : ""
                }`}
                loading="lazy"
                alt="Cover"
              />
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

            {entry.secondaryText &&
              (entry.secondaryHref ? (
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
              ))}
          </div>
        </div>

        <div className="flex items-center justify-center h-full" />

        <div className="text-center font-bold text-gray-700">
          {formatNumber(entry.totalPoints)}
        </div>
        <div className="flex justify-center">
          {pointsPctStr === "--" ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">
              --
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pointsPctStr.includes("-") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
            >
              {pointsPctStr}%
            </span>
          )}
        </div>

        <div
          className={`text-center h-full flex flex-col justify-center border-l border-white ${peakBgClass}`}
        >
          <div className="font-bold leading-none text-gray-700">
            {entry.peakPosition === 101 ? "--" : entry.peakPosition}
          </div>
          {entry.peakStreak && (
            <div
              className={`text-[9px] ${streakColorClass} font-bold uppercase mt-0.5`}
            >
              {entry.peakStreak}x
            </div>
          )}
        </div>
        <div className="text-center text-gray-400 font-medium text-xs">
          {entry.weeksOnChart}
        </div>

        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopSales ? "bg-[#f8e285] font-bold" : "bg-[#fff0ad] font-medium"}`}
        >
          {formatNumber(salesUnits)}
        </div>
        <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#fff0ad]">
          {salesPct}
        </div>

        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopStreams ? "bg-[#bcf08e] font-bold" : "bg-[#d5f7bb] font-medium"}`}
        >
          {formatNumber(streamsUnits)}
        </div>
        <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#d5f7bb]">
          {streamsPct}
        </div>

        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${isTopAirplay ? "bg-[#9adafe] font-bold" : "bg-[#b4e3ff] font-medium"}`}
        >
          {formatNumber(airplayUnits)}
        </div>
        <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#b4e3ff]">
          {airplayPct}
        </div>

        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-purple-900 ${isTopUnits ? "bg-[#dcace8] font-bold" : "bg-[#e7d6ff] font-bold"}`}
        >
          {formatNumber(totalUnits)}
        </div>
      </div>

      {isExpanded && !entry.disableDropdown && (
        <ChartRowDropdown
          entry={entry}
          onOpenModal={() => setIsModalOpen(true)}
        />
      )}

      {isModalOpen && (
        <ChartTicketModal
          entry={entry}
          week={week}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
