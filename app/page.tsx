import { supabase } from '@/utils/supabase';
import ChartRow from './components/ChartRow';

const formatDateRange = (startDateStr: string, endDateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const startStr = new Date(startDateStr).toLocaleDateString('en-US', options);
  const endStr = new Date(endDateStr).toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

export default async function Home() {
  const { data: latestWeek, error: weekErr } = await supabase
    .from('chart_weeks')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  if (weekErr || !latestWeek) {
    return <div className="p-10 font-bold text-red-500">Error loading chart weeks. Is the DB empty?</div>;
  }

  const { data: entries, error: entriesErr } = await supabase
    .from('chart_entries')
    .select(`
      *,
      songs (
        title,
        artists ( name ),
        albums ( cover_url )
      )
    `)
    .eq('week_id', latestWeek.id)
    .lte('rank', 100) 
    .order('rank', { ascending: true });

  if (entriesErr) return <div className="p-10 text-red-500">Error loading chart entries.</div>;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px] p-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
            Week of {formatDateRange(latestWeek.start_date, latestWeek.end_date)}
          </p>
          <div className="border px-4 py-1 rounded shadow-sm text-sm font-semibold">
            {latestWeek.end_date}
          </div>
        </div>

        <div className="text-xs border-t-2 border-black shadow-sm">
          <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-500 border-b border-gray-300 bg-gray-50 uppercase tracking-wider">
            <div className="py-3 text-center">Rank</div>
            <div className="py-3 text-center">+/-</div>
            <div className="py-3 pl-2">Song</div>
            <div className="py-3 text-center"></div> 
            <div className="py-3 text-center">Points</div>
            <div className="py-3 text-center">%</div>
            <div className="py-3 text-center text-chart-peak-text bg-chart-peak-bg">Peak</div>
            <div className="py-3 text-center">WoC</div>
            <div className="py-3 text-center text-chart-sales-text bg-chart-sales-bg">Sales</div>
            <div className="py-3 text-center text-chart-sales-text bg-chart-sales-bg">%</div>
            <div className="py-3 text-center text-chart-streams-text bg-chart-streams-bg">Streams</div>
            <div className="py-3 text-center text-chart-streams-text bg-chart-streams-bg">%</div>
            <div className="py-3 text-center text-chart-airplay-text bg-chart-airplay-bg">Airplay</div>
            <div className="py-3 text-center text-chart-airplay-text bg-chart-airplay-bg">%</div>
            <div className="py-3 text-center text-chart-units-text bg-chart-units-bg">Units</div>
          </div>
          
          {entries?.map((entry) => (
             <ChartRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}