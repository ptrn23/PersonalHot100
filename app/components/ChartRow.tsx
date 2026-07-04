"use client";

import { useState } from "react";
import Link from "next/link";
import { getStableSeed, applyDeviation } from "@/utils/metrics";
import { formatNumber } from "@/utils/formatters";
import ChartRowDropdown from "./ChartRowDropdown";
import ChartTicketModal from "./ChartTicketModal";
import { DisplayEntry, MaxStats } from "@/types";

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

  const streamsPct =
    totalRawForPct > 0 ? Math.round(((entry.streams * 4) / totalRawForPct) * 100) + "%" : "0%";
  const salesPct =
    totalRawForPct > 0 ? Math.round(((entry.sales * 0.45) / totalRawForPct) * 100) + "%" : "0%";
  const airplayPct =
    totalRawForPct > 0 ? Math.round(((entry.airplay * 5) / totalRawForPct) * 100) + "%" : "0%";

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
    <div className="group flex flex-col border-b border-gray-100">
      <div
        onClick={() => !entry.disableDropdown && setIsExpanded(!isExpanded)}
        className={`grid h-14 grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center transition-colors ${
          entry.disableDropdown ? "cursor-default" : "cursor-pointer"
        } ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
      >
        <div className="text-center text-xl font-black text-gray-800">
          {entry.isOut ? "-" : entry.rank}
        </div>

        <div className="text-center text-xs font-bold">
          {entry.hideRankChange ? (
            <span className="text-gray-300">-</span>
          ) : entry.isOut ? (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">OUT</span>
          ) : (
            <>
              {status === "re" && (
                <span className="rounded bg-purple-50 px-1 text-[#8e0be5]">RE</span>
              )}
              {status === "new" && (
                <span className="rounded bg-blue-50 px-1 text-[#05a7e5]">NEW</span>
              )}
              {status === "stable" && <span className="text-xl leading-none text-black">=</span>}
              {status === "rise" && <span className="text-green-600">+{rankChange}</span>}
              {status === "fall" && <span className="text-red-500">-{rankChange}</span>}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-hidden py-1 pl-2">
          <div className="relative block h-10 w-10 shrink-0 bg-gray-200 shadow-sm">
            {entry.coverUrl && (
              <img
                src={entry.coverUrl}
                className={`h-full w-full object-cover transition-all ${
                  entry.isOut ? "opacity-80 grayscale" : ""
                }`}
                loading="lazy"
                alt="Cover"
              />
            )}
          </div>

          <div className="flex flex-col justify-center truncate pr-4">
            {entry.primaryHref ? (
              <Link
                href={entry.primaryHref}
                className="block truncate leading-tight font-bold text-gray-900 transition-colors hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.primaryText}
              </Link>
            ) : (
              <div className="block truncate leading-tight font-bold text-gray-900">
                {entry.primaryText}
              </div>
            )}

            {entry.secondaryText &&
              (entry.secondaryHref ? (
                <Link
                  href={entry.secondaryHref}
                  className="truncate text-xs font-medium text-gray-500 transition-colors hover:text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entry.secondaryText}
                </Link>
              ) : (
                <div className="truncate text-xs font-medium text-gray-500">
                  {entry.secondaryText}
                </div>
              ))}
          </div>
        </div>

        <div className="flex h-full items-center justify-center" />

        <div className="text-center font-bold text-gray-700">{formatNumber(entry.totalPoints)}</div>
        <div className="flex justify-center">
          {pointsPctStr === "--" ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-400">--</span>
          ) : (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${pointsPctStr.includes("-") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
            >
              {pointsPctStr}%
            </span>
          )}
        </div>

        <div
          className={`flex h-full flex-col justify-center border-l border-white text-center ${peakBgClass}`}
        >
          <div className="leading-none font-bold text-gray-700">
            {entry.peakPosition === 101 ? "--" : entry.peakPosition}
          </div>
          {entry.peakStreak && (
            <div className={`text-[9px] ${streakColorClass} mt-0.5 font-bold uppercase`}>
              {entry.peakStreak}x
            </div>
          )}
        </div>
        <div className="text-center text-xs font-medium text-gray-400">{entry.weeksOnChart}</div>

        <div
          className={`flex h-full items-center justify-center border-l border-white text-center text-gray-700 ${isTopSales ? "bg-[#f8e285] font-bold" : "bg-[#fff0ad] font-medium"}`}
        >
          {formatNumber(salesUnits)}
        </div>
        <div className="flex h-full items-center justify-center border-l border-[#fff0ad] bg-[#fff0ad] text-center text-xs text-gray-400">
          {salesPct}
        </div>

        <div
          className={`flex h-full items-center justify-center border-l border-white text-center text-gray-700 ${isTopStreams ? "bg-[#bcf08e] font-bold" : "bg-[#d5f7bb] font-medium"}`}
        >
          {formatNumber(streamsUnits)}
        </div>
        <div className="flex h-full items-center justify-center border-l border-[#d5f7bb] bg-[#d5f7bb] text-center text-xs text-gray-400">
          {streamsPct}
        </div>

        <div
          className={`flex h-full items-center justify-center border-l border-white text-center text-gray-700 ${isTopAirplay ? "bg-[#9adafe] font-bold" : "bg-[#b4e3ff] font-medium"}`}
        >
          {formatNumber(airplayUnits)}
        </div>
        <div className="flex h-full items-center justify-center border-l border-[#b4e3ff] bg-[#b4e3ff] text-center text-xs text-gray-400">
          {airplayPct}
        </div>

        <div
          className={`flex h-full items-center justify-center border-l border-white text-center text-purple-900 ${isTopUnits ? "bg-[#dcace8] font-bold" : "bg-[#e7d6ff] font-bold"}`}
        >
          {formatNumber(totalUnits)}
        </div>
      </div>

      {isExpanded && !entry.disableDropdown && (
        <ChartRowDropdown entry={entry} onOpenModal={() => setIsModalOpen(true)} />
      )}

      {isModalOpen && (
        <ChartTicketModal entry={entry} week={week} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
