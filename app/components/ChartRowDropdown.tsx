"use client";

import Link from "next/link";
import { Share2, Ticket, LineChart } from "lucide-react";
import { formatNumber } from "../utils/chartMath";
import { DisplayEntry } from "./ChartRow";

export default function ChartRowDropdown({
  entry,
  onOpenModal,
}: {
  entry: DisplayEntry;
  onOpenModal: () => void;
}) {
  return (
    <div className="cursor-default overflow-hidden border-t border-gray-100 bg-white px-8 py-5 text-sm shadow-inner">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mb-2 block border-b pb-1 text-xs font-bold text-gray-800 uppercase">
            Scores
          </span>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Streams:</span> <span className="font-mono">{formatNumber(entry.streams)}</span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Sales:</span> <span className="font-mono">{formatNumber(entry.sales)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Airplay:</span> <span className="font-mono">{formatNumber(entry.airplay)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="mb-2 block border-b pb-1 text-xs font-bold text-gray-800 uppercase">
            Points
          </span>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Streams:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{formatNumber(entry.streams)} x 5 = </span>
              <span className="text-gray-800">{formatNumber(entry.streams * 5)}</span>
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>Sales:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{formatNumber(entry.sales)} x 3 = </span>
              <span className="text-gray-800">{formatNumber(entry.sales * 3)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Airplay:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-xs text-gray-400">{formatNumber(entry.airplay)} x 2 = </span>
              <span className="text-gray-800">{formatNumber(entry.airplay * 2)}</span>
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
                {formatNumber(entry.streams * 5)} + {formatNumber(entry.sales * 3)} +{" "}
                {formatNumber(entry.airplay * 2)} =
              </span>
              <span className="ml-1 text-gray-800">{formatNumber(entry.currentWeekPoints)}</span>
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between text-gray-600">
            <span>1 week ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-[10px] text-gray-400 sm:text-xs">
                {formatNumber(entry.previousWeekRawPoints || 0)} x 30% =
              </span>
              <span className="ml-1 text-gray-800">
                {formatNumber(Math.floor((entry.previousWeekRawPoints || 0) * 0.3))}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>2 weeks ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-[10px] text-gray-400 sm:text-xs">
                {formatNumber(entry.twoWeeksAgoRawPoints || 0)} x 20% =
              </span>
              <span className="ml-1 text-gray-800">
                {formatNumber(Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2))}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="mb-1 text-xs font-bold text-blue-800 uppercase">Total Points</span>
          <span className="mb-1 text-4xl leading-none font-black tracking-tighter text-blue-900">
            {formatNumber(entry.totalPoints)}
          </span>
          <span className="font-mono text-[12px] font-bold tracking-tight text-blue-600/70">
            {formatNumber(entry.currentWeekPoints)} +{" "}
            {formatNumber(Math.floor((entry.previousWeekRawPoints || 0) * 0.3))} +{" "}
            {formatNumber(Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2))}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Share2 className="h-4 w-4 text-gray-500" />
          Share & Export
        </h4>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          <div className="flex h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-400 italic">
            News Feed placeholders go here
          </div>
          <div className="flex h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-400 italic">
            Copy-pastable caption placeholder
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
