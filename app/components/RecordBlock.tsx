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
  weeks: number;
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
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {topEntry && (
          <div className="bg-white shadow-md rounded-lg flex items-center p-4 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00e699]" />
            
            <div className="flex items-center w-full relative z-10 pl-2">
              <div className="w-16 h-16 bg-[#00e699] text-black font-black text-3xl flex items-center justify-center shrink-0 -ml-4 shadow-sm z-20">
                1
              </div>

              <div className="w-32 h-32 bg-gray-200 shrink-0 shadow-sm ml-4 border border-gray-100 relative">
                {topEntry.coverUrl ? (
                  <img
                    src={topEntry.coverUrl}
                    alt={topEntry.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                    No Cover
                  </div>
                )}
              </div>

              <div className="ml-6 flex-1 pr-4">
                <Link
                  href={`/library/song/${topEntry.id}`}
                  className="text-2xl font-black leading-tight text-gray-900 hover:text-[#B30000] transition-colors line-clamp-1"
                >
                  {topEntry.title}
                </Link>
                <div className="text-gray-600 font-medium text-lg mt-1 line-clamp-1">
                  {topEntry.artist}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-end justify-center text-xs font-bold text-gray-500 uppercase tracking-widest gap-1 pr-8 border-r border-gray-100">
                <div className="flex justify-between w-24">
                  <span>{metricLabel}</span>
                  <span className="text-black font-black">{topEntry.metricValue}</span>
                </div>
                <div className="flex justify-between w-24">
                  <span>Peak</span>
                  <span className="text-black font-black">
                    {topEntry.peak === 101 ? "--" : topEntry.peak}
                  </span>
                </div>
                <div className="flex justify-between w-24">
                  <span>Weeks</span>
                  <span className="text-black font-black">{topEntry.weeks}</span>
                </div>
              </div>

              <Link
                href={`/library/song/${topEntry.id}`}
                className="ml-6 w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-colors shrink-0 mr-2"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {runnerUps.map((entry) => (
          <div
            key={entry.rank}
            className="bg-white shadow-sm rounded-lg flex items-center p-3 group hover:shadow-md transition-shadow border border-gray-50"
          >
            <div className="flex items-center w-full">
              <div className="w-12 text-center text-xl font-black text-gray-900 shrink-0">
                {entry.rank}
              </div>

              <div className="w-16 h-16 bg-gray-200 shrink-0 shadow-sm ml-2 border border-gray-100">
                {entry.coverUrl ? (
                  <img
                    src={entry.coverUrl}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-[8px] uppercase">
                    No Cover
                  </div>
                )}
              </div>

              <div className="ml-4 flex-1 pr-4">
                <Link
                  href={`/library/song/${entry.id}`}
                  className="text-lg font-black leading-tight text-gray-900 hover:text-[#B30000] transition-colors line-clamp-1 block"
                >
                  {entry.title}
                </Link>
                <div className="text-gray-500 font-medium text-sm line-clamp-1">
                  {entry.artist}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-end justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest gap-0.5 pr-6 border-r border-gray-100">
                <div className="flex justify-between w-20">
                  <span>{metricLabel}</span>
                  <span className="text-gray-800 font-black">{entry.metricValue}</span>
                </div>
                <div className="flex justify-between w-20">
                  <span>Peak</span>
                  <span className="text-gray-800 font-black">
                    {entry.peak === 101 ? "--" : entry.peak}
                  </span>
                </div>
                <div className="flex justify-between w-20">
                  <span>Weeks</span>
                  <span className="text-gray-800 font-black">{entry.weeks}</span>
                </div>
              </div>
              
              <Link
                href={`/library/song/${entry.id}`}
                className="ml-5 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 hover:text-black hover:border-black transition-colors shrink-0 mr-2"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}