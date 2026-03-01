'use client';

import { useState } from 'react';
import FeedTooltip from './FeedTooltip';

// Local helper for formatting inside the component
const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'm';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

export default function ChartRow({ song }: { song: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Logic for Peak Background Color (Moved from page.tsx)
  let peakBgClass = 'bg-blue-50/50'; // Default
  let streakColorClass = 'text-gray-400'; // Default
  if (song.isNewPeak) {peakBgClass = 'bg-[#ffe49a]'; streakColorClass = 'text-[#7e3d01]';} 
  else if (song.isRePeak) {peakBgClass = 'bg-[#cdecff]'; streakColorClass = 'text-[#024da0]';}

  return (
    <div className="flex flex-col border-b border-gray-100 group">
      {/* THE MAIN ROW (Clickable) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center h-14 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
      >
        {/* Rank */}
        <div className="font-black text-xl text-center text-gray-800">{song.rank}</div>
        
        {/* Change Indicator with Custom Colors */}
        <div className="text-center font-bold text-xs">
          {song.status === 're' && <span className="text-[#8e0be5] bg-purple-50 px-1 rounded">RE</span>}
          {song.status === 'new' && <span className="text-[#05a7e5] bg-blue-50 px-1 rounded">NEW</span>}
          {song.status === 'stable' && <span className="text-black text-xl leading-none">=</span>}
          {song.status === 'rise' && <span className="text-green-600">+{song.change}</span>}
          {song.status === 'fall' && <span className="text-red-500">-{song.change}</span>}
        </div>

        {/* Song Info */}
        <div className="flex items-center gap-3 pl-2 overflow-hidden py-1">
          <div className="w-10 h-10 bg-gray-200 shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow">
            {song.coverUrl && <img src={song.coverUrl} className="w-full h-full object-cover" loading="lazy" />}
          </div>
          <div className="truncate pr-4">
            <div className="font-bold leading-tight truncate text-gray-900">{song.title}</div>
            <div className="text-xs text-gray-500 truncate font-medium">{song.artist}</div>
          </div>
        </div>

        {/* Feed Indicator Column (Stop click from opening dropdown when clicking tooltip) */}
        <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
          {song.feed && song.feed.length > 0 && (
            <FeedTooltip feed={song.feed} />
          )}
        </div>

        {/* Points Section */}
        <div className="text-center font-bold text-gray-700">{song.points}</div>
        <div className="flex justify-center">
            {song.pointsPct === '--' ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">--</span>
            ) : (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${song.pointsPct.includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {Math.round(parseFloat(song.pointsPct) * 100)}%
              </span>
            )}
        </div>

        {/* Chart Stats with Dynamic Background */}
        <div className={`text-center h-full flex flex-col justify-center border-l border-white ${peakBgClass}`}>
          <div className="font-bold leading-none text-gray-700">{song.peak}</div>
          {song.peakStreak && <div className={`text-[9px] ${streakColorClass} font-bold uppercase mt-0.5`}>{song.peakStreak}x</div>}
        </div>
        <div className="text-center text-gray-400 font-medium text-xs">{song.woc}</div>

        {/* Sales (Yellow) */}
        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 
          ${song.isTopSales ? 'bg-[#f8e285] font-bold' : 'bg-[#fff0ad] font-medium'}`}>
          {formatNumber(song.salesUnits)}
        </div>
        <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#fff0ad]">
          {Math.round(parseFloat(song.salesPct) * 100)}%
        </div>

        {/* Streams (Green) */}
        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700
          ${song.isTopStreams ? 'bg-[#bcf08e] font-bold' : 'bg-[#d5f7bb] font-medium'}`}>
          {formatNumber(song.streamsUnits)}
        </div>
        <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#d5f7bb]">
          {Math.round(parseFloat(song.streamsPct) * 100)}%
        </div>

        {/* Airplay (Blue) */}
        <div className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700
          ${song.isTopAirplay ? 'bg-[#9adafe] font-bold' : 'bg-[#b4e3ff] font-medium'}`}>
          {formatNumber(song.airplayUnits)}
        </div>
        <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#b4e3ff]">
          {Math.round(parseFloat(song.airplayPct) * 100)}%
        </div>

          {/* Units (Purple) */}
          <div className={`text-center h-full flex items-center justify-center border-l border-white text-purple-900
          ${song.isTopUnits ? 'bg-[#dcace8] font-bold' : 'bg-[#e7d6ff] font-bold'}`}>
          {formatNumber(song.units)}
        </div>
      </div>

      {/* THE DROPDOWN PANEL */}
      {isExpanded && (
        <div className="bg-white border-t border-gray-100 px-8 py-5 text-sm shadow-inner overflow-hidden cursor-default">
          <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-3 text-xs">Points Calculation Breakdown</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: Raw Scores */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">Scrobble Scores</span>
              <div className="flex justify-between text-gray-600 mb-1"><span>Streams:</span> <span className="font-mono">{formatNumber(song.streams)}</span></div>
              <div className="flex justify-between text-gray-600 mb-1"><span>Sales:</span> <span className="font-mono">{formatNumber(song.sales)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Airplay:</span> <span className="font-mono">{formatNumber(song.airplay)}</span></div>
            </div>

            {/* Column 2: Component Points */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">Base Points</span>
              <div className="flex justify-between text-gray-600 mb-1"><span>Streams:</span> <span className="font-mono">{formatNumber(song.streamsPoints)}</span></div>
              <div className="flex justify-between text-gray-600 mb-1"><span>Sales:</span> <span className="font-mono">{formatNumber(song.salesPoints)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Airplay:</span> <span className="font-mono">{formatNumber(song.airplayPoints)}</span></div>
            </div>

            {/* Column 3: Decay Multipliers */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">Time Decay</span>
              <div className="flex justify-between text-gray-600 mb-1"><span>Current Wk:</span> <span className="font-mono">{formatNumber(song.currentWeekPoints)}</span></div>
              <div className="flex justify-between text-gray-600 mb-1"><span>W-1 (30%):</span> <span className="font-mono">{formatNumber(song.previousWeekPoints)}</span></div>
              <div className="flex justify-between text-gray-600"><span>W-2 (20%):</span> <span className="font-mono">{formatNumber(song.twoWeeksAgoPoints)}</span></div>
            </div>

            {/* Column 4: Final Total */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col justify-center items-center">
              <span className="font-bold text-blue-800 text-xs uppercase mb-1">Total Points</span>
              <span className="text-3xl font-black text-blue-900 tracking-tighter">
                {formatNumber(song.points)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}