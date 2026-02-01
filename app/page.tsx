import fs from 'fs';
import path from 'path';

// --- TYPES ---
type Song = {
  rank: number;
  title: string;
  artist: string;
  coverUrl: string;
  status: 'rise' | 'fall' | 'stable' | 'new';
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

// --- HELPERS ---
const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'm';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

async function getChartData(): Promise<ChartData | null> {
  const filePath = path.join(process.cwd(), 'public/data/latest_chart.json');
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// --- COMPONENTS ---
export default async function Home() {
  const chart = await getChartData();

  if (!chart) return <div className="p-10 text-center">Data not found. Run python script.</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 overflow-x-auto">
      <div className="min-w-[1200px] p-8"> {/* Force width for horizontal scrolling on small screens */}
        
        {/* HEADER */}
        <header className="mb-6 flex justify-between items-center px-2">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Personal Hot 100</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Week of {chart.meta.week}, {chart.meta.year}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-red-500">@ptrn23</div>
          </div>
        </header>
        
        {/* TABLE */}
        <div className="text-sm border-t-2 border-black">
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-white sticky top-0 z-10">
            <div className="py-2 text-center">Rank</div>
            <div className="py-2 text-center">+/-</div>
            <div className="py-2 pl-2">Song</div>
            <div className="py-2 text-center">Points</div>
            <div className="py-2 text-center">%</div>
            <div className="py-2 text-center bg-blue-50">Peak</div>
            <div className="py-2 text-center">WoC</div>
            <div className="py-2 text-center bg-yellow-100">Sales</div>
            <div className="py-2 text-center bg-yellow-100">%</div>
            <div className="py-2 text-center bg-green-100">Streams</div>
            <div className="py-2 text-center bg-green-100">%</div>
            <div className="py-2 text-center bg-blue-100">Airplay</div>
            <div className="py-2 text-center bg-blue-100">%</div>
            <div className="py-2 text-center bg-purple-100 text-purple-900">Units</div>
          </div>

          {/* Rows */}
          {chart.songs.map((song) => (
            <div 
              key={song.title + song.artist} 
              className="grid grid-cols-[3rem_3rem_1fr_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center border-b border-gray-100 hover:bg-gray-50 h-14"
            >
              {/* Rank */}
              <div className="font-black text-xl text-center">{song.rank}</div>
              
              {/* Change Indicator */}
              <div className="text-center font-bold text-xs">
                {song.status === 'new' && <span className="text-blue-500">NEW</span>}
                {song.status === 'stable' && <span className="text-gray-400 text-lg">=</span>}
                {song.status === 'rise' && <span className="text-green-600">+{song.change}</span>}
                {song.status === 'fall' && <span className="text-red-500">-{song.change}</span>}
              </div>

              {/* Song Info */}
              <div className="flex items-center gap-3 pl-2 overflow-hidden">
                <div className="w-10 h-10 bg-gray-200 shrink-0">
                  {song.coverUrl && <img src={song.coverUrl} className="w-full h-full object-cover" />}
                </div>
                <div className="truncate pr-4">
                  <div className="font-bold leading-tight truncate">{song.title}</div>
                  <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                </div>
              </div>

              {/* Points Section */}
              <div className="text-center font-bold">{song.points}</div>
              <div className={`text-center text-xs font-bold ${song.pointsPct.includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} py-1 mx-1 rounded`}>
                {Math.round(parseFloat(song.pointsPct) * 100)}%
              </div>

              {/* Chart Stats (Peak/WoC) */}
              <div className="text-center bg-blue-50 h-full flex flex-col justify-center border-l border-white">
                <div className="font-bold leading-none">{song.peak}</div>
                {song.peakStreak && <div className="text-[10px] text-blue-500 font-bold leading-none">{song.peakStreak}x</div>}
              </div>
              <div className="text-center text-gray-500 text-sm">{song.woc}</div>

              {/* Component Breakdowns (Yellow/Green/Blue/Purple) */}
              
              {/* Sales (Yellow) */}
              <div className="text-center bg-yellow-50 h-full flex items-center justify-center font-medium border-l border-white">
                {formatNumber(song.sales)}
              </div>
              <div className="text-center bg-yellow-50 h-full flex items-center justify-center text-xs text-gray-500 border-l border-white">
                {Math.round(parseFloat(song.salesPct) * 100)}%
              </div>

              {/* Streams (Green) */}
              <div className="text-center bg-green-50 h-full flex items-center justify-center font-medium border-l border-white">
                {formatNumber(song.streams)}
              </div>
              <div className="text-center bg-green-50 h-full flex items-center justify-center text-xs text-gray-500 border-l border-white">
                {Math.round(parseFloat(song.streamsPct) * 100)}%
              </div>

              {/* Airplay (Blue) */}
              <div className="text-center bg-blue-50 h-full flex items-center justify-center font-medium border-l border-white">
                {formatNumber(song.airplay)}
              </div>
              <div className="text-center bg-blue-50 h-full flex items-center justify-center text-xs text-gray-500 border-l border-white">
                {Math.round(parseFloat(song.airplayPct) * 100)}%
              </div>

               {/* Units (Purple) */}
               <div className="text-center bg-purple-100 h-full flex items-center justify-center font-bold text-purple-900 border-l border-white">
                {formatNumber(song.units)}
              </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}