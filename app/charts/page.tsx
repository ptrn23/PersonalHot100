import Link from "next/link";
import { Activity, Calendar, ArrowRight, Calendar1 } from "lucide-react";

export default function ChartsDirectoryPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] px-10 pt-24 pb-12 text-gray-900 md:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 border-b-4 border-black pb-8">
          <span className="mb-2 block text-sm font-bold tracking-[0.3em] text-gray-400 uppercase">
            Directory
          </span>
          <h1 className="text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
            Charts
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Link
            href="/charts/live"
            className="group flex min-h-[300px] flex-col justify-between bg-black p-10 text-white shadow-black/20 transition-transform hover:-translate-y-2 hover:shadow-2xl"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm bg-[#B30000]">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h2 className="mb-2 text-4xl font-black tracking-tight uppercase">Live Chart</h2>
              <p className="max-w-sm font-medium text-gray-400">
                View the current, active tracking week. Get a real-time glimpse into the latest
                trends and movements!
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <ArrowRight className="h-8 w-8 text-gray-600 transition-colors group-hover:translate-x-2 group-hover:text-white" />
            </div>
          </Link>

          <Link
            href="/charts/weekly"
            className="group flex min-h-[300px] flex-col justify-between border-4 border-black bg-white p-10 text-black shadow-black/10 transition-transform hover:-translate-y-2 hover:shadow-2xl"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border-2 border-black bg-gray-100">
                <Calendar className="h-7 w-7 text-black" />
              </div>
              <h2 className="mb-2 text-4xl font-black tracking-tight uppercase">Weekly Charts</h2>
              <p className="max-w-sm font-medium text-gray-600">
                Access and explore previous weeks' charts. Dive into historical data, past
                placements, and certified records!
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <ArrowRight className="h-8 w-8 text-gray-300 transition-colors group-hover:translate-x-2 group-hover:text-black" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
