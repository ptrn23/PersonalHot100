import fs from 'fs';
import path from 'path';
import WeekSelector from './components/WeekSelector';
import FeedTooltip from './components/FeedTooltip';
import ChartRow from './components/ChartRow';

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
  isNewPeak?: boolean;
  isRePeak?: boolean;
  woc: string;
  salesUnits: number;
  salesPct: string;
  streamsUnits: number;
  streamsPct: string;
  airplayUnits: number;
  airplayPct: string;
  units: number;
  isTopSales: boolean;
  isTopStreams: boolean;
  isTopAirplay: boolean;
  isTopUnits: boolean;
  feed?: string[];
  streams: number;
  sales: number;
  airplay: number;
  streamsPoints: number;
  salesPoints: number;
  airplayPoints: number;
  currentWeekPoints: number;
  previousWeekPoints: number;
  twoWeeksAgoPoints: number;
}

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

const formatDateRange = (year: string, weekDate: string) => {
  const [monthStr, dayStr] = weekDate.split('-');
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const yearNum = parseInt(year, 10);

  const startDate = new Date(yearNum, month, day);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  };

  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);

  return `${startStr} - ${endStr}`;
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
        <p className="text-sm text-gray-500">Try running: <code className="bg-gray-100 p-1">npx tsx scripts/build_charts.ts</code></p>
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
                Week of {formatDateRange(chart.meta.year, chart.meta.week)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <WeekSelector weeks={availableWeeks} activeWeek={activeWeek} />
          </div>
        </header>
        
        {/* TABLE */}
        <div className="text-sm border-t-2 border-black shadow-sm">
          <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
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

          {chart.songs.map((song) => (
            <ChartRow key={`${song.title}-${song.artist}`} song={song} />
          ))}
        </div>
      </div>
    </main>
  );
}