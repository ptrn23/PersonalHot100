'use client';

import { useRouter } from 'next/navigation';

type Props = {
  weeks: string[];
  activeWeek: string;
};

export default function WeekSelector({ weeks, activeWeek }: Props) {
  const router = useRouter();

  return (
    <div className="relative">
      <select
        value={activeWeek}
        onChange={(e) => {
          // Navigate to the same page but with a new query param
          router.push(`/?week=${e.target.value}`);
        }}
        className="appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg font-bold text-sm uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-200 transition-colors"
      >
        {weeks.map((week) => (
          <option key={week} value={week}>
            {week}
          </option>
        ))}
      </select>
      {/* Custom arrow icon for style */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}