import { supabase } from '@/utils/supabase';
import ChartRow from './components/ChartRow';
import WeekSelector from './components/WeekSelector'; 

const formatDateRange = (startDateStr: string, endDateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    timeZone: 'UTC'
  };
  const startStr = new Date(startDateStr).toLocaleDateString('en-US', options);
  const endStr = new Date(endDateStr).toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;

  const { data: availableWeeks, error: weeksErr } = await supabase
    .from('chart_weeks')
    .select('*')
    .order('start_date', { ascending: false });

  if (weeksErr || !availableWeeks || availableWeeks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4">No Data Found</h1>
        <p className="mb-4 text-gray-600">The database is currently empty.</p>
      </div>
    );
  }

  let activeWeek = availableWeeks[0];
  if (params.week) {
    const found = availableWeeks.find(w => w.end_date === params.week); // Matching by end_date like "2026-06-05"
    if (found) activeWeek = found;
  }

  const { data: entries } = await supabase
    .from('chart_entries')
    .select(`
      *,
      songs (
        title,
        artists ( name ),
        albums ( cover_url )
      )
    `)
    .eq('week_id', activeWeek.id)
    .lte('rank', 100)
    .order('rank', { ascending: true });

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-auto">
      <div className="min-w-[1200px] p-8">
        <header className="mb-6 flex justify-between items-end px-2">
          <div className="flex gap-6 items-center">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Personal Hot 100</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
                Week of {formatDateRange(activeWeek.start_date, activeWeek.end_date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <WeekSelector 
              weeks={availableWeeks.map(w => w.end_date)} 
              activeWeek={activeWeek.end_date} 
            />
          </div>
        </header>
        
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
          
          {entries?.map((entry) => (
            <ChartRow key={entry.id} entry={entry} />
          ))}

        </div>
      </div>
    </main>
  );
}