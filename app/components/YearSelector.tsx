"use client";

import { useRouter } from "next/navigation";

import { ChevronDown } from "lucide-react";

export default function YearSelector({
  years,
  activeYear,
  destination = "/charts/year-end",
}: {
  years: number[];
  activeYear: number;
  destination?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-end">
      <div className="relative">
        <select
          value={activeYear}
          onChange={(e) => router.push(`${destination}?year=${e.target.value}`)}
          className="cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-2 pr-10 font-bold text-gray-800 shadow-sm transition-colors focus:border-black focus:outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y} Year-End Chart
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
