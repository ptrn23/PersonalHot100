import fs from 'fs';
import path from 'path';
import WeekSelector from './components/WeekSelector';

// --- TYPES ---
type Song = {
  rank: number;
  title: string;
  artist: string;
  coverUrl: string;
  status: 'rise' | 'fall' | 'stable' | 'new' | 're';
  change: number;
  points: number;
  pointsPct: string;
  peak: string;
  peakStreak: string;
  woc: string;
  sales: number;
  salesPct: string;
  streams: number;
  streamsPct: string;
  airplay: number;
  airplayPct: string;
  units: number;
};

type ChartData = {
  meta: { year: string; week: string };
  songs: Song[];
};

// --- DATA FETCHING ---
const DATA_DIR = path.join(process.cwd(), 'public/data');

function getAvailableWeeks(): string[] {
  try {
    const indexPath = path.join(DATA_DIR, 'index.json');
    if (!fs.existsSync(indexPath)) return [];
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    return [];
  }
}

async function getChartData(week: string): Promise<ChartData | null> {
  const filePath = path.join(DATA_DIR, 'weeks', `${week}.json`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// --- HELPERS ---
const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'm';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

// --- COMPONENT ---
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  // 1. Get list of all weeks
  const availableWeeks = getAvailableWeeks();
  
  // 2. Determine which week to show (URL param OR latest available)
  // We need to await searchParams in Next.js 15, but for 14 it's direct.
  // Assuming Next.js 14+:
  const params = await searchParams;
  const activeWeek = params.week || availableWeeks[0];

  // 3. Fetch data
  const chart = await getChartData(activeWeek);

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10">
        <h1 className="text-2xl font-bold mb-4">No Data Found</h1>
        <p className="mb-4">Could not load chart for week: {activeWeek}</p>
        <p className="text-sm text-gray-500">Try running: <code className="bg-gray-100 p-1">npx tsx scripts/build-charts.ts</code></p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 overflow-x-auto">
      <div className="min-w-[1200px] p-8">
        
        {/* HEADER */}
        <header className="mb-6 flex justify-between items-end px-2">
          <div className="flex gap-6 items-center">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Personal Hot 100</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
                Week of {chart.meta.week}, {chart.meta.year}
              </p>
            </div>
            
            {/* DROPDOWN COMPONENT */}
            <WeekSelector weeks={availableWeeks} activeWeek={activeWeek} />
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-red-500">DEVELOPER MODE</div>
          </div>
        </header>
        
        {/* TABLE */}
        <div className="text-sm border-t-2 border-black shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
            <div className="py-2 text-center">Rank</div>
            <div className="py-2 text-center">+/-</div>
            <div className="py-2 pl-2">Song</div>
            <div className="py-2 text-center">Points</div>
            <div className="py-2 text-center">%</div>
            <div className="py-2 text-center bg-blue-50/50">Peak</div>
            <div className="py-2 text-center">WoC</div>
            <div className="py-2 text-center bg-yellow-100/50">Sales</div>
            <div className="py-2 text-center bg-yellow-100/50">%</div>
            <div className="py-2 text-center bg-green-100/50">Streams</div>
            <div className="py-2 text-center bg-green-100/50">%</div>
            <div className="py-2 text-center bg-blue-100/50">Airplay</div>
            <div className="py-2 text-center bg-blue-100/50">%</div>
            <div className="py-2 text-center bg-purple-100/50 text-purple-900">Units</div>
          </div>

          {/* Rows */}
          {chart.songs.map((song) => (
            <div 
              key={`${song.title}-${song.artist}`} 
              className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center border-b border-gray-100 hover:bg-gray-50 h-14 transition-colors group"
            >
              {/* Rank */}
              <div className="font-black text-xl text-center text-gray-800">{song.rank}</div>
              
              {/* Change Indicator */}
              <div className="text-center font-bold text-xs">
                {song.status === 're' && <span className="text-blue-600 bg-blue-50 px-1 rounded">RE</span>}
                {song.status === 'new' && <span className="text-blue-600 bg-blue-50 px-1 rounded">NEW</span>}
                {song.status === 'stable' && <span className="text-gray-300 text-xl leading-none">=</span>}
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

              {/* Points Section */}
              <div className="text-center font-bold text-gray-700">{song.points}</div>
              <div className="flex justify-center">
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${song.pointsPct.includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {Math.round(parseFloat(song.pointsPct) * 100)}%
                 </span>
              </div>

              {/* Chart Stats */}
              <div className="text-center bg-blue-50/30 h-full flex flex-col justify-center border-l border-white">
                <div className="font-bold leading-none text-gray-700">{song.peak}</div>
                {song.peakStreak && <div className="text-[9px] text-blue-500 font-bold uppercase mt-0.5">{song.peakStreak}x</div>}
              </div>
              <div className="text-center text-gray-400 font-medium text-xs">{song.woc}</div>

              {/* Sales (Yellow) */}
              <div className="text-center bg-yellow-50/50 h-full flex items-center justify-center font-medium border-l border-white text-gray-700">
                {formatNumber(song.sales)}
              </div>
              <div className="text-center bg-yellow-50/50 h-full flex items-center justify-center text-xs text-gray-400 border-l border-white">
                {Math.round(parseFloat(song.salesPct) * 100)}%
              </div>

              {/* Streams (Green) */}
              <div className="text-center bg-green-50/50 h-full flex items-center justify-center font-medium border-l border-white text-gray-700">
                {formatNumber(song.streams)}
              </div>
              <div className="text-center bg-green-50/50 h-full flex items-center justify-center text-xs text-gray-400 border-l border-white">
                {Math.round(parseFloat(song.streamsPct) * 100)}%
              </div>

              {/* Airplay (Blue) */}
              <div className="text-center bg-blue-50/50 h-full flex items-center justify-center font-medium border-l border-white text-gray-700">
                {formatNumber(song.airplay)}
              </div>
              <div className="text-center bg-blue-50/50 h-full flex items-center justify-center text-xs text-gray-400 border-l border-white">
                {Math.round(parseFloat(song.airplayPct) * 100)}%
              </div>

               {/* Units (Purple) */}
               <div className="text-center bg-purple-50 h-full flex items-center justify-center font-bold text-purple-900 border-l border-white">
                {formatNumber(song.units)}
              </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}