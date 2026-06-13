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
    <div className="bg-white border-t border-gray-100 px-8 py-5 text-sm shadow-inner overflow-hidden cursor-default">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
            Scores
          </span>
          <div className="flex justify-between items-center text-gray-600 mb-1">
            <span>Streams:</span>{" "}
            <span className="font-mono">{formatNumber(entry.streams)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600 mb-1">
            <span>Sales:</span>{" "}
            <span className="font-mono">{formatNumber(entry.sales)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Airplay:</span>{" "}
            <span className="font-mono">{formatNumber(entry.airplay)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
            Points
          </span>
          <div className="flex justify-between items-center text-gray-600 mb-1">
            <span>Streams:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-gray-400 text-xs">
                {formatNumber(entry.streams)} x 5 ={" "}
              </span>
              <span className="text-gray-800">
                {formatNumber(entry.streams * 5)}
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600 mb-1">
            <span>Sales:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-gray-400 text-xs">
                {formatNumber(entry.sales)} x 3 ={" "}
              </span>
              <span className="text-gray-800">
                {formatNumber(entry.sales * 3)}
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Airplay:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-gray-400 text-xs">
                {formatNumber(entry.airplay)} x 2 ={" "}
              </span>
              <span className="text-gray-800">
                {formatNumber(entry.airplay * 2)}
              </span>
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
                {formatNumber(entry.streams * 5)} +{" "}
                {formatNumber(entry.sales * 3)} +{" "}
                {formatNumber(entry.airplay * 2)} =
              </span>
              <span className="text-gray-800 ml-1">
                {formatNumber(entry.currentWeekPoints)}
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600 mb-1">
            <span>1 week ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                {formatNumber(entry.previousWeekRawPoints || 0)} x 30% =
              </span>
              <span className="text-gray-800 ml-1">
                {formatNumber(
                  Math.floor((entry.previousWeekRawPoints || 0) * 0.3),
                )}
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>2 weeks ago:</span>
            <span className="font-mono whitespace-nowrap">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                {formatNumber(entry.twoWeeksAgoRawPoints || 0)} x 20% =
              </span>
              <span className="text-gray-800 ml-1">
                {formatNumber(
                  Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2),
                )}
              </span>
            </span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col justify-center items-center">
          <span className="font-bold text-blue-800 text-xs uppercase mb-1">
            Total Points
          </span>
          <span className="text-4xl font-black text-blue-900 tracking-tighter leading-none mb-1">
            {formatNumber(entry.totalPoints)}
          </span>
          <span className="text-[12px] text-blue-600/70 font-mono font-bold tracking-tight">
            {formatNumber(entry.currentWeekPoints)} +{" "}
            {formatNumber(Math.floor((entry.previousWeekRawPoints || 0) * 0.3))}{" "}
            +{" "}
            {formatNumber(Math.floor((entry.twoWeeksAgoRawPoints || 0) * 0.2))}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mt-6">
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
              onClick={onOpenModal}
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
  );
}
