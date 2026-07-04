import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type RecordEntry = {
  id: string;
  rank: number;
  coverUrl: string | null;
  title: string;
  artist: string;
  metricValue: string | number;
  peak: number;
  weekDisplay: string;
  weekUrl: string;
};

type RecordBlockProps = {
  title: string;
  metricLabel: string;
  entries: RecordEntry[];
};

export default function RecordBlock({ title, metricLabel, entries }: RecordBlockProps) {
  if (!entries || entries.length === 0) return null;

  const topEntry = entries[0];
  const runnerUps = entries.slice(1);

  return (
    <div className="mb-16">
      <div className="mb-6 flex items-baseline justify-between border-b-2 border-black pb-2">
        <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase md:text-3xl">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {topEntry && (
          <div className="group relative flex items-center overflow-hidden bg-white p-4 shadow-md">
            <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#B30000]" />

            <div className="relative z-10 flex w-full items-center pl-2">
              <div className="z-20 -ml-4 flex h-16 w-16 shrink-0 items-center justify-center bg-[#B30000] text-3xl font-black text-white shadow-sm">
                1
              </div>

              <div className="relative ml-4 h-32 w-32 shrink-0 border border-gray-100 bg-gray-200 shadow-sm">
                {topEntry.coverUrl ? (
                  <img
                    src={topEntry.coverUrl}
                    alt={topEntry.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400 uppercase">
                    No Cover
                  </div>
                )}
              </div>

              <div className="ml-6 flex-1 pr-4">
                <Link
                  href={`/library/song/${topEntry.id}`}
                  className="line-clamp-1 text-2xl leading-tight font-black text-gray-900 transition-colors hover:text-[#B30000]"
                >
                  {topEntry.title}
                </Link>
                <div className="mt-1 line-clamp-1 text-lg font-medium text-gray-600">
                  {topEntry.artist}
                </div>
              </div>

              <div className="hidden flex-col items-end justify-center gap-1 border-r border-gray-100 pr-8 text-xs font-bold tracking-widest text-gray-500 uppercase md:flex">
                <div className="flex w-28 justify-between">
                  <span>{metricLabel}</span>
                  <span className="font-black text-black">{topEntry.metricValue}</span>
                </div>
                <div className="flex w-28 justify-between">
                  <span>Peak</span>
                  <span className="font-black text-black">
                    {topEntry.peak === 101 ? "--" : topEntry.peak}
                  </span>
                </div>
                <div className="flex w-28 justify-between">
                  <span>Week</span>
                  <span className="font-black text-black">{topEntry.weekDisplay}</span>
                </div>
              </div>

              <Link
                href={`/charts/weekly?week=${topEntry.weekUrl}`}
                className="mr-2 ml-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 transition-colors hover:border-black hover:text-black"
                title="View Chart Week"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

        {runnerUps.map((entry) => (
          <div
            key={entry.rank}
            className="group flex items-center border border-gray-50 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex w-full items-center">
              <div className="w-12 shrink-0 text-center text-xl font-black text-gray-900">
                {entry.rank}
              </div>

              <div className="ml-2 h-16 w-16 shrink-0 border border-gray-100 bg-gray-200 shadow-sm">
                {entry.coverUrl ? (
                  <img
                    src={entry.coverUrl}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-gray-400 uppercase">
                    No Cover
                  </div>
                )}
              </div>

              <div className="ml-4 flex-1 pr-4">
                <Link
                  href={`/library/song/${entry.id}`}
                  className="line-clamp-1 block text-lg leading-tight font-black text-gray-900 transition-colors hover:text-[#B30000]"
                >
                  {entry.title}
                </Link>
                <div className="line-clamp-1 text-sm font-medium text-gray-500">{entry.artist}</div>
              </div>

              <div className="hidden flex-col items-end justify-center gap-0.5 border-r border-gray-100 pr-6 text-[10px] font-bold tracking-widest text-gray-400 uppercase md:flex">
                <div className="flex w-24 justify-between">
                  <span>{metricLabel}</span>
                  <span className="font-black text-gray-800">{entry.metricValue}</span>
                </div>
                <div className="flex w-24 justify-between">
                  <span>Peak</span>
                  <span className="font-black text-gray-800">
                    {entry.peak === 101 ? "--" : entry.peak}
                  </span>
                </div>
                <div className="flex w-24 justify-between">
                  <span>Week</span>
                  <span className="font-black text-gray-800">{entry.weekDisplay}</span>
                </div>
              </div>

              <Link
                href={`/charts/weekly?week=${entry.weekUrl}`}
                className="mr-2 ml-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-300 transition-colors hover:border-black hover:text-black"
                title="View Chart Week"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
