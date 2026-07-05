"use client";

import { DisplayEntry } from "@/types";
import { calculateDetailedUnits } from "@/utils/metrics";
import { formatNumber } from "@/utils/formatters";

import { CHART_NAME } from "@/config/constants";

export default function ChartTicket({ entry }: { entry: DisplayEntry }) {
  const { streamsUnits, salesUnits, airplayUnits } = calculateDetailedUnits(
    entry.streams,
    entry.sales,
    entry.airplay,
    entry.mathSeedString,
  );

  return (
    <div
      className="relative flex aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gray-900 text-white shadow-2xl"
      style={{
        maskImage: "radial-gradient(circle at -2px 12px, transparent 6px, black 7px)",
        maskSize: "100% 24px",
        maskRepeat: "repeat-y",
        WebkitMaskImage: "radial-gradient(circle at -2px 12px, transparent 6px, black 7px)",
        WebkitMaskSize: "100% 24px",
        WebkitMaskRepeat: "repeat-y",
      }}
    >
      <div className="relative h-full w-1/2">
        {entry.coverUrl ? (
          <img
            src={entry.coverUrl}
            alt={entry.primaryText}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-800" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

        <div className="absolute top-6 left-8">
          <span className="text-6xl leading-none font-black tracking-tighter italic drop-shadow-md">
            #{entry.rank}
          </span>
        </div>

        <div className="absolute bottom-6 left-8 flex flex-col pr-6">
          <span className="mb-1 line-clamp-2 text-2xl leading-6 font-bold drop-shadow-md">
            {entry.primaryText}
          </span>
          <span className="line-clamp-1 text-base leading-none font-medium text-gray-300 drop-shadow-md">
            {entry.secondaryText}
          </span>
        </div>
      </div>

      <div className="absolute top-0 bottom-0 left-1/2 z-10 -ml-[1px] w-[2px] border-l-2 border-dashed border-white/70" />

      <div className="relative flex h-full w-1/2 flex-col justify-between overflow-hidden p-8">
        <div className="absolute inset-0 z-0">
          {entry.coverUrl && (
            <img
              src={entry.coverUrl}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-75 blur-2xl"
            />
          )}
        </div>

        <div className="relative z-10">
          <p className="mb-1 text-xs font-bold tracking-widest text-white/70 uppercase">
            {CHART_NAME} Hot 100
          </p>
          <p className="text-sm leading-4 font-medium">
            Charting for <span className="font-bold text-white">{entry.weeksOnChart} weeks</span>
          </p>
        </div>

        <div className="relative z-10 -mt-4 flex flex-col items-center justify-center">
          <span className="text-6xl font-black tracking-tighter">{entry.totalPoints}</span>
          <span className="text-lg font-bold tracking-widest text-white/50 uppercase">POINTS</span>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-0.5 text-[10px] font-bold tracking-widest text-[#f8e285] uppercase">
              Sales
            </div>
            <div className="text-lg leading-none font-bold">{formatNumber(salesUnits)}</div>
          </div>
          <div>
            <div className="mb-0.5 text-[10px] font-bold tracking-widest text-[#bcf08e] uppercase">
              Streams
            </div>
            <div className="text-lg leading-none font-bold">{formatNumber(streamsUnits)}</div>
          </div>
          <div>
            <div className="mb-0.5 text-[10px] font-bold tracking-widest text-[#9adafe] uppercase">
              Radio
            </div>
            <div className="text-lg leading-none font-bold">{formatNumber(airplayUnits)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
