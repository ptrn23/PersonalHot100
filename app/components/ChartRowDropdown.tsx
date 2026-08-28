"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Ticket, LineChart, Copy, Check } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { calculateDetailedUnits } from "@/utils/metrics";
import { DisplayEntry } from "@/types";
import { CHART_NAME, CHART_HANDLE } from "@/config/constants";

const getMovementStr = (rank: number, previousRank: number | null) => {
  if (!previousRank) return "(NEW)";
  const diff = previousRank - rank;
  if (diff > 0) return `(+${diff})`;
  if (diff < 0) return `(${diff})`;
  return "(=)";
};

export default function ChartRowDropdown({
  entry,
  week,
  chartLabel = "this week",
  onOpenModal,
}: {
  entry: DisplayEntry;
  week: string;
  chartLabel?: string;
  onOpenModal: () => void;
}) {
  const [copiedNews, setCopiedNews] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const movementStr = getMovementStr(entry.rank, entry.previousRank);

  const { streamsUnits, salesUnits, airplayUnits } = calculateDetailedUnits(
    entry.streams || 0,
    entry.sales || 0,
    entry.airplay || 0,
    entry.mathSeedString || ""
  );

  let statusPhrase = `ranks at #${entry.rank} on the ${CHART_HANDLE} Hot 100 this week`;
  if (entry.weeksOnChart === 1) {
    statusPhrase = `debuts at #${entry.rank} on the ${CHART_HANDLE} Hot 100`;
  } else if (entry.rank === 1 && entry.isNewPeak) {
    statusPhrase = `has reached #1 on the ${CHART_HANDLE} Hot 100 for the first time this week`;
  } else if (entry.rank === 1) {
    statusPhrase = `spends another week at #1 on the ${CHART_HANDLE} Hot 100`;
  } else if (entry.isNewPeak) {
    statusPhrase = `reaches a new peak of #${entry.rank} on the ${CHART_HANDLE} Hot 100 this week`;
  }
  
  const newsFeedText = `${CHART_HANDLE} Hot 100 (chart dated ${week})\n\n#${entry.rank} ${movementStr}: ${entry.primaryText} — ${entry.secondaryText}`;

  const captionText = `"${entry.primaryText}" by ${entry.secondaryText} ${statusPhrase}, with ${entry.totalPoints?.toLocaleString("en-US")} points!\n\nSales: ${formatNumber(salesUnits).toUpperCase()}\nStreams: ${formatNumber(streamsUnits).toUpperCase()}\nRadio: ${formatNumber(airplayUnits).toUpperCase()}`;

  const handleCopy = async (text: string, type: 'news' | 'caption') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'news') {
        setCopiedNews(true);
        setTimeout(() => setCopiedNews(false), 2000);
      } else {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="cursor-default overflow-hidden border-t border-gray-100 bg-white px-8 py-5 text-sm shadow-inner">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mb-2 block border-b pb-1 text-xs font-bold text-gray-800 uppercase">
            Scores
          </span>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Streams:</span> <span className="font-mono">{entry.streams}</span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Sales:</span> <span className="font-mono">{entry.sales}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Airplay:</span> <span className="font-mono">{entry.airplay}</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mb-2 block border-b pb-1 text-xs font-bold text-gray-800 uppercase">
            Points
          </span>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Streams:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{entry.streams} x 5 = </span>
              <span className="text-gray-800">{entry.streams * 5}</span>
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Sales:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{entry.sales} x 3 = </span>
              <span className="text-gray-800">{entry.sales * 3}</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Airplay:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{entry.airplay} x 2 = </span>
              <span className="text-gray-800">{entry.airplay * 2}</span>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mb-2 block border-b pb-1 text-xs font-bold text-gray-800 uppercase">
            Decay
          </span>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>This week:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-[10px] text-gray-400 sm:text-xs">
                {entry.streams * 5} + {entry.sales * 3} + {entry.airplay * 2} =
              </span>
              <span className="ml-1 text-gray-800">{entry.currentWeekPoints}</span>
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>1 week ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-[10px] text-gray-400 sm:text-xs">
                {entry.previousWeekRawPoints || 0} x 30% =
              </span>
              <span className="ml-1 text-gray-800">
                {Math.floor((entry.previousWeekRawPoints || 0) * 0.3)}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>2 weeks ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-[10px] text-gray-400 sm:text-xs">
                {entry.twoWeeksAgoRawPoints || 0} x 20% =
              </span>
              <span className="ml-1 text-gray-800">
                {Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="mb-1 text-xs font-bold text-blue-800 uppercase">Total Points</span>
          <span className="mb-1 text-4xl leading-none font-black tracking-tighter text-blue-900">
            {entry.totalPoints}
          </span>
          <span className="font-mono text-[12px] font-bold tracking-tight text-blue-600/70">
            {entry.currentWeekPoints} + {Math.floor((entry.previousWeekRawPoints || 0) * 0.3)} +{" "}
            {Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2)}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Share2 className="h-4 w-4 text-gray-500" />
          Share & Export
        </h4>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          
          <div className="relative group flex h-[120px] rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs text-gray-700 shadow-sm overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans select-all">{newsFeedText}</pre>
            <button 
              onClick={() => handleCopy(newsFeedText, 'news')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-white border border-gray-200 p-1.5 rounded shadow-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="Copy to clipboard"
            >
              {copiedNews ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          
          <div className="relative group flex h-[120px] rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs text-gray-700 shadow-sm overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans select-all">{captionText}</pre>
            <button 
              onClick={() => handleCopy(captionText, 'caption')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-white border border-gray-200 p-1.5 rounded shadow-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="Copy to clipboard"
            >
              {copiedCaption ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onOpenModal}
              className="flex items-center justify-center gap-2.5 rounded-lg bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow transition-colors hover:bg-gray-700"
            >
              <Ticket className="h-5 w-5" />
              View Chart Ticket
            </button>
            <Link
              href={entry.primaryHref || "#"}
              className="flex items-center justify-center gap-2.5 rounded-lg border-2 border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <LineChart className="h-5 w-5 text-gray-500" />
              View All-Time Stats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
