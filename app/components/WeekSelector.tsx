"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { formatDateRange } from "@/utils/formatters";

type Props = {
  weeks: { start_date: string; end_date: string }[];
  activeWeek: string;
  destination: string;
};

export default function WeekSelector({ weeks, activeWeek, destination }: Props) {
  const router = useRouter();

  return (
    <div className="relative">
      <select
        value={activeWeek}
        onChange={(e) => {
          const encodedDate = encodeURIComponent(e.target.value);
          router.push(`${destination}?week=${encodedDate}`);
        }}
        className="cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-100 py-2 pr-8 pl-4 text-sm font-bold tracking-wide text-gray-700 uppercase transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {weeks.map((week) => (
          <option key={week.start_date} value={week.start_date}>
            {formatDateRange(week.start_date, week.end_date)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}