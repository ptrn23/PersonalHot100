import fs from 'fs';
import path from 'path';

// Define the shape of our data so TypeScript is happy
type Song = {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  rank: number;
};

type ChartData = {
  meta: { year: number; generated_at: string };
  songs: Song[];
};

async function getChartData(): Promise<ChartData | null> {
  // This finds the file in your 'public' folder
  const filePath = path.join(process.cwd(), 'public/data/latest_chart.json');
  
  if (!fs.existsSync(filePath)) return null;
  
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function Home() {
  const chart = await getChartData();

  if (!chart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Data Not Found</h1>
          <p className="text-gray-600">
            Please run <code className="bg-gray-200 px-1 rounded">python scripts/export_json.py</code> first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Personal Hot 100</h1>
          <p className="text-gray-500">Week of {chart.meta.generated_at}</p>
        </header>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">#</th>
                <th className="p-4 w-20">Cover</th>
                <th className="p-4">Track Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chart.songs.map((song) => (
                <tr key={`${song.title}-${song.artist}`} className="hover:bg-gray-50 transition-colors">
                  {/* Rank Column */}
                  <td className="p-4 text-center font-black text-2xl text-gray-800">
                    {song.rank}
                  </td>
                  
                  {/* Image Column */}
                  <td className="p-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden relative shadow-inner">
                      {/* Standard img tag avoids Next.js config complexity for now */}
                      {song.coverUrl ? (
                        <img 
                          src={song.coverUrl} 
                          alt={song.album} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Art</div>
                      )}
                    </div>
                  </td>
                  
                  {/* Details Column */}
                  <td className="p-4 align-middle">
                    <div className="font-bold text-lg leading-tight mb-1">{song.title}</div>
                    <div className="text-gray-500 font-medium">{song.artist}</div>
                    <div className="text-gray-400 text-xs mt-1 uppercase tracking-wide">{song.album}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}