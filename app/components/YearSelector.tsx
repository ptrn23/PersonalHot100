"use client";

import { useRouter } from "next/navigation";

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
      <select
        value={activeYear}
        onChange={(e) => router.push(`${destination}?year=${e.target.value}`)}
        className="relative cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-2 pr-10 font-bold text-gray-800 shadow-sm transition-colors focus:border-black focus:outline-none"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
          backgroundPosition: "right 10px center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y} Year-End Chart
          </option>
        ))}
      </select>
    </div>
  );
}
