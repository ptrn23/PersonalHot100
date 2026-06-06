import Link from "next/link";
import { Activity, Calendar, ArrowRight } from "lucide-react";

const WaveformBackground = () => {
  return (
    <div className="absolute inset-0 flex items-end justify-between gap-1 md:gap-2 px-4 opacity-[0.03] z-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => {
        const height = 10 + Math.sin(i) * 40 + Math.random() * 50;
        const delay = Math.random() * 3;

        return (
          <div
            key={i}
            className="w-full bg-black rounded-t-sm animate-pulse"
            style={{
              height: `${Math.max(10, height)}%`,
              animationDuration: "4s",
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col justify-center relative overflow-hidden">
      <WaveformBackground />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B30000]/5 blur-[150px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-900/5 blur-[120px] rounded-full pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto w-full px-10 md:px-24 z-10 relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-[2px] bg-[#B30000]" />
          <span className="text-[#B30000] font-bold tracking-[0.3em] uppercase text-xs md:text-sm">
            Personal Charts
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-black uppercase tracking-tighter leading-[0.85] mb-8">
          The Data
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-400">
            Of Sound.
          </span>
        </h1>

        <p className="text-gray-500 text-lg md:text-xl max-w-xl font-medium leading-relaxed mb-10">
          An algorithmic tracking system designed to visualize your listening
          habits and build your own Hot 100.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/charts/live"
            className="group bg-[#B30000] hover:bg-red-800 text-white px-6 py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/10"
          >
            <Activity className="w-5 h-5" />
            Live Chart
            <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>

          <Link
            href="/charts/weekly"
            className="group bg-black hover:bg-gray-800 text-white px-6 py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Weekly Charts
            <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 bg-white/80 backdrop-blur-md overflow-hidden py-2.5">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] opacity-40">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="text-[10px] text-gray-900 font-mono font-bold uppercase tracking-[0.3em] px-8 border-r border-gray-300"
            >
              What's your #1 Hit? • What are you listening to? • Do you know
              your music history?
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
