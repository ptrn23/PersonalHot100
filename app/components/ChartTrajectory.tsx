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

type ChartTrajectoryProps = {
  songEntries: any[];
  allGlobalWeeks: string[];
};

const formatBillboardDate = (isoString: string) => {
  const d = new Date(isoString);
  const m = d.getMonth() + 1;
  const day = d.getDate().toString().padStart(2, "0");
  const y = d.getFullYear().toString().slice(2);
  return `${m}/${day}/${y}`;
};

export default function ChartTrajectory({ songEntries, allGlobalWeeks }: ChartTrajectoryProps) {
  const [mode, setMode] = useState<"compact" | "run" | "full">("run");

  const chartData = useMemo(() => {
    const entryMap = new Map();
    songEntries.forEach((entry) => {
      entryMap.set(entry.chart_weeks.start_date, {
        rank: entry.rank,
        points: entry.total_points,
      });
    });

    if (mode === "compact") {
      const compactData: any[] = [];
      
      for (let i = 0; i < songEntries.length; i++) {
        const current = songEntries[i];
        
        compactData.push({
          date: formatBillboardDate(current.chart_weeks.start_date),
          fullDate: current.chart_weeks.start_date,
          rank: current.rank,
          points: current.total_points,
        });

        if (i < songEntries.length - 1) {
          const next = songEntries[i + 1];
          const currTime = new Date(current.chart_weeks.start_date).getTime();
          const nextTime = new Date(next.chart_weeks.start_date).getTime();
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

    let weeksToMap = allGlobalWeeks;

    if (mode === "run" && songEntries.length > 0) {
      const debutDate = songEntries[0].chart_weeks.start_date;
      const lastDate = songEntries[songEntries.length - 1].chart_weeks.start_date;
      const startIndex = allGlobalWeeks.indexOf(debutDate);
      const endIndex = allGlobalWeeks.indexOf(lastDate);
      
      if (startIndex !== -1 && endIndex !== -1) {
        weeksToMap = allGlobalWeeks.slice(startIndex, endIndex + 1);
      }
    }

    return weeksToMap.map((weekDate) => {
      const data = entryMap.get(weekDate);
      return {
        date: formatBillboardDate(weekDate),
        fullDate: weekDate,
        rank: data ? data.rank : null,
        points: data ? data.points : null,
      };
    });
  }, [mode, songEntries, allGlobalWeeks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data.rank) return null; 

      const isNo1 = data.rank === 1;

      return (
        <div className={`bg-white p-4 shadow-2xl transform -translate-y-2 transition-all ${
          isNo1 ? "border-4 border-[#d4af37]" : "border-2 border-black"
        }`}>
          {isNo1 && (
            <div className="bg-[#d4af37] text-white text-[10px] font-black uppercase tracking-widest text-center py-1 mb-2">
              No. 1 Hit
            </div>
          )}
          
          <div className="font-bold border-b border-gray-300 pb-1 mb-2 text-xs text-gray-500 uppercase tracking-widest">
            Week of {data.date}
          </div>
          
          <div className="flex items-end justify-between gap-8">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pos.</div>
              <div className={`text-4xl font-black leading-none ${isNo1 ? "text-[#d4af37]" : "text-[#B30000]"}`}>
                #{data.rank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Points</div>
              <div className="text-2xl font-black leading-none">{data.points}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex bg-gray-100 p-1 border border-gray-300 rounded-sm mb-6">
        {(["compact", "run", "full"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
              mode === m ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* The Graph */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6b7280' }} 
              tickMargin={10}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis 
              reversed={true} 
              domain={[1, 100]} 
              tick={{ fontSize: 12, fontWeight: 'black', fill: '#000000' }} 
              axisLine={false}
              tickLine={false}
              width={60}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }} 
              isAnimationActive={false}
            />
            
            <Line 
              type="monotone" 
              dataKey="rank" 
              stroke="#B30000" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#B30000', strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
              connectNulls={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}