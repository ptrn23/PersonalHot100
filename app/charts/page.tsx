import Link from "next/link";
import { Activity, Calendar, ArrowRight, Calendar1 } from "lucide-react";

export default function ChartsDirectoryPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pt-24 pb-12 px-10 md:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 border-b-4 border-black pb-8">
          <span className="text-gray-400 font-bold uppercase tracking-[0.3em] text-sm mb-2 block">
            Directory
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Charts
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link 
            href="/charts/live" 
            className="group flex flex-col justify-between bg-black text-white p-10 min-h-[300px] transition-transform hover:-translate-y-2 hover:shadow-2xl shadow-black/20"
          >
            <div>
              <div className="bg-[#B30000] w-14 h-14 flex items-center justify-center rounded-sm mb-6">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
                Live Chart
              </h2>
              <p className="text-gray-400 font-medium max-w-sm">
                View the current, active tracking week. Get a real-time glimpse into the latest trends and movements!
              </p>
            </div>
            <div className="flex justify-end mt-8">
              <ArrowRight className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors group-hover:translate-x-2" />
            </div>
          </Link>

          <Link 
            href="/charts/weekly" 
            className="group flex flex-col justify-between bg-white text-black border-4 border-black p-10 min-h-[300px] transition-transform hover:-translate-y-2 hover:shadow-2xl shadow-black/10"
          >
            <div>
              <div className="bg-gray-100 border-2 border-black w-14 h-14 flex items-center justify-center rounded-sm mb-6">
                <Calendar className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
                Weekly Charts
              </h2>
              <p className="text-gray-600 font-medium max-w-sm">
                Access and explore previous weeks' charts. Dive into historical data, past placements, and certified records!
              </p>
            </div>
            <div className="flex justify-end mt-8">
              <ArrowRight className="w-8 h-8 text-gray-300 group-hover:text-black transition-colors group-hover:translate-x-2" />
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}