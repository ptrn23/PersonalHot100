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
  isNewPeak?: boolean; // Optional bc older JSONs might not have it yet
  isRePeak?: boolean;
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
  const availableWeeks = getAvailableWeeks();
  const params = await searchParams;
  const activeWeek = params.week || availableWeeks[0];
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
            <WeekSelector weeks={availableWeeks} activeWeek={activeWeek} />
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-red-500">DEVELOPER MODE</div>
          </div>
        </header>
        
        {/* TABLE */}
        <div className="text-sm border-t-2 border-black shadow-sm">
          <div className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
            <div className="py-2 text-center">Rank</div>
            <div className="py-2 text-center">+/-</div>
            <div className="py-2 pl-2">Song</div>
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

          {chart.songs.map((song) => {
            // Logic for Peak Background Color
            let peakBgClass = 'bg-blue-50/50'; // Default
            let streakColorClass = 'text-gray-400'; // Default
            if (song.isNewPeak) {peakBgClass = 'bg-[#ffe49a]'; streakColorClass = 'text-[#7e3d01]';} // New Peak (Light Yellow)
            else if (song.isRePeak) {peakBgClass = 'bg-[#cdecff]'; streakColorClass = 'text-[#024da0]';} // Re-peak (Light Blue)

            return (
              <div 
                key={`${song.title}-${song.artist}`} 
                className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center border-b border-gray-100 hover:bg-gray-50 h-14 transition-colors group"
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

                {/* Points Section */}
                <div className="text-center font-bold text-gray-700">{song.points}</div>
                <div className="flex justify-center">
                   {/* Handle '--' for new entries */}
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

                {/* Sales */}
                <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center font-medium border-l border-[#fff0ad] text-gray-700">
                  {formatNumber(song.sales)}
                </div>
                <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#fff0ad]">
                  {Math.round(parseFloat(song.salesPct) * 100)}%
                </div>

                {/* Streams */}
                <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center font-medium border-l border-[#d5f7bb] text-gray-700">
                  {formatNumber(song.streams)}
                </div>
                <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#d5f7bb]">
                  {Math.round(parseFloat(song.streamsPct) * 100)}%
                </div>

                {/* Airplay */}
                <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center font-medium border-l border-[#b4e3ff] text-gray-700">
                  {formatNumber(song.airplay)}
                </div>
                <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#b4e3ff]">
                  {Math.round(parseFloat(song.airplayPct) * 100)}%
                </div>

                 {/* Units */}
                 <div className="text-center bg-[#e7d6ff] h-full flex items-center justify-center font-bold text-purple-900 border-l border-[#e7d6ff]">
                  {formatNumber(song.units)}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}