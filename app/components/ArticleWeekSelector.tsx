"use client";

import { useRouter } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";

type Props = {
  availableWeeks: { start_date: string; end_date: string }[];
  currentWeek: string;
};

export default function ArticleWeekSelector({ availableWeeks, currentWeek }: Props) {
  const router = useRouter();

  return (
    <div className="relative inline-flex items-center gap-3 border-2 border-black bg-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <Calendar size={16} className="text-[#B30000]" />
      <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
        Edition:
      </span>
      
      <div className="relative flex items-center">
        <select
          value={currentWeek}
          onChange={(e) => {
            const encodedDate = encodeURIComponent(e.target.value);
            router.push(`/news/article?week=${encodedDate}`);
          }}
          className="cursor-pointer appearance-none bg-transparent pr-6 text-[11px] font-black uppercase text-black outline-none"
        >
          {availableWeeks.map((week) => (
            <option key={week.start_date} value={week.start_date}>
              {formatDateRange(week.start_date, week.end_date)}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-0 text-black" strokeWidth={3} />
      </div>
    </div>
  );
}
