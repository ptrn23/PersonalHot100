"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatShortDate } from "@/utils/formatters";

type ChartTrajectoryProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  songEntries: any[];
  allGlobalWeeks: string[];
};

export default function ChartTrajectory({ songEntries, allGlobalWeeks }: ChartTrajectoryProps) {
  const [mode, setMode] = useState<"compact" | "run" | "full">("run");

  const chartData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDate = (e: any) => e.chart_weeks?.start_date || e.start_date;
    const sortedGlobalWeeks = [...allGlobalWeeks].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    const sortedEntries = [...songEntries].sort(
      (a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime(),
    );

    const entryMap = new Map();
    sortedEntries.forEach((entry) => {
      entryMap.set(getDate(entry), {
        rank: entry.rank,
        points: entry.total_points,
      });
    });

    if (mode === "compact") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compactData: any[] = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const current = sortedEntries[i];
        const currDate = getDate(current);

        compactData.push({
          date: formatShortDate(currDate),
          fullDate: currDate,
          rank: current.rank,
          points: current.total_points,
        });

        if (i < sortedEntries.length - 1) {
          const next = sortedEntries[i + 1];
          const nextDate = getDate(next);
          const currTime = new Date(currDate).getTime();
          const nextTime = new Date(nextDate).getTime();
          const daysDiff = Math.round((nextTime - currTime) / (1000 * 3600 * 24));

          if (daysDiff > 8) {
            compactData.push({
              date: "...",
              fullDate: `gap-${i}`,
              rank: null,
              points: null,
            });
          }
        }
      }
      return compactData;
    }

    let weeksToMap = sortedGlobalWeeks;

    if (mode === "run" && sortedEntries.length > 0) {
      const debutDate = getDate(sortedEntries[0]);
      const lastDate = getDate(sortedEntries[sortedEntries.length - 1]);

      const startIndex = sortedGlobalWeeks.indexOf(debutDate);
      const endIndex = sortedGlobalWeeks.indexOf(lastDate);

      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        weeksToMap = sortedGlobalWeeks.slice(startIndex, endIndex + 1);
      }
    }

    return weeksToMap.map((weekDate) => {
      const data = entryMap.get(weekDate);
      return {
        date: formatShortDate(weekDate),
        fullDate: weekDate,
        rank: data ? data.rank : null,
        points: data ? data.points : null,
      };
    });
  }, [mode, songEntries, allGlobalWeeks]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data.rank) return null;

      const isNo1 = data.rank === 1;

      return (
        <div
          className={`-translate-y-2 transform bg-white p-4 shadow-2xl transition-all ${
            isNo1 ? "border-4 border-[#d4af37]" : "border-2 border-black"
          }`}
        >
          {isNo1 && (
            <div className="mb-2 bg-[#d4af37] py-1 text-center text-[10px] font-black tracking-widest text-white uppercase">
              No. 1 Hit
            </div>
          )}

          <div className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-gray-500 uppercase">
            Week of {data.date}
          </div>

          <div className="flex items-end justify-between gap-8">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Pos.
              </div>
              <div
                className={`text-4xl leading-none font-black ${isNo1 ? "text-[#d4af37]" : "text-[#B30000]"}`}
              >
                #{data.rank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Points
              </div>
              <div className="text-2xl leading-none font-black">{data.points}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-6 flex rounded-sm border border-gray-300 bg-gray-100 p-1">
        {(["compact", "run", "full"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all ${
              mode === m ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fontWeight: "bold", fill: "#6b7280" }}
              tickMargin={10}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              reversed={true}
              domain={[1, 100]}
              tick={{ fontSize: 12, fontWeight: "black", fill: "#000000" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#000",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="rank"
              stroke="#B30000"
              strokeWidth={3}
              dot={{ r: 3, fill: "#B30000", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#000", stroke: "#fff", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
