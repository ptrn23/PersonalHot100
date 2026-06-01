'use client';

import { useState } from 'react';
import ChartRow from './ChartRow';
import WeekSelector from './WeekSelector';

type Props = {
  entries: any[] | null;
  availableWeeks: string[];
  activeWeekDate: string;
  formattedDateRange: string;
};

export default function ChartView({ entries, availableWeeks, activeWeekDate, formattedDateRange }: Props) {
  const [layoutWidth, setLayoutWidth] = useState<'slim' | 'normal' | 'wide'>('normal');
  const [searchQuery, setSearchQuery] = useState('');

  const getContainerWidth = () => {
    switch (layoutWidth) {
      case 'slim': return 'max-w-[1200px] min-w-[1200px]';
      case 'wide': return 'max-w-[1750px] min-w-[1750px]';
      case 'normal':
      default: return 'max-w-[1450px] min-w-[1450px]';
    }
  };

  const filteredEntries = entries?.filter((entry) => {
    if (!searchQuery) return true;
    
    const term = searchQuery.toLowerCase();
    const songTitle = entry.songs?.title?.toLowerCase() || '';
    const artistName = entry.songs?.artists?.name?.toLowerCase() || '';
    const albumTitle = entry.songs?.albums?.title?.toLowerCase() || '';

    return songTitle.includes(term) || artistName.includes(term) || albumTitle.includes(term);
  });

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-auto pb-24">
      <div className={`mx-auto p-8 transition-all duration-300 ease-in-out ${getContainerWidth()}`}>
        
        <header className="mb-6 flex justify-between items-end px-2">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Hot 100</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
              Week of {formattedDateRange}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="relative flex items-center">
              <svg className="w-3.5 h-3.5 absolute left-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 focus:w-64 transition-all duration-300 bg-white border border-gray-300 text-gray-900 py-1.5 pl-9 pr-8 rounded-lg font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black shadow-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-[#B30000] transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm">
              {(['slim', 'normal', 'wide'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLayoutWidth(mode)}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    layoutWidth === mode 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-400 hover:text-black'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <WeekSelector weeks={availableWeeks} activeWeek={activeWeekDate} />
          </div>
        </header>

        <div className="text-sm border-t-2 border-black shadow-sm bg-white min-h-[500px]">
          <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 sticky top-[88px] z-10">
            <div className="py-2 text-center">Rank</div>
            <div className="py-2 text-center">+/-</div>
            <div className="py-2 pl-2">Song</div>
            <div className="py-2 text-center">{}</div> 
            <div className="py-2 text-center">Points</div>
            <div className="py-2 text-center">%</div>
            <div className="py-2 text-center bg-blue-50/50">Peak</div>
            <div className="py-2 text-center">WoC</div>
            <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">Sales</div>
            <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">%</div>
            <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">Streams</div>
            <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">%</div>
            <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">Airplay</div>
            <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">%</div>
            <div className="py-2 text-center text-[#721a46] bg-[#eddcfe]">Units</div>
          </div>

          {filteredEntries && filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <ChartRow key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
              No matching chart records found.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}