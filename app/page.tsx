import Link from "next/link";
import { Activity, Calendar, ArrowRight } from "lucide-react";

import { CHART_NAME } from "@/config/constants";

const WaveformBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-end justify-between gap-1 overflow-hidden px-4 opacity-[0.03] md:gap-2">
      {[...Array(50)].map((_, i) => {
        const height = 10 + Math.sin(i) * 40 + Math.random() * 50;
        const delay = Math.random() * 3;

        return (
          <div
            key={i}
            className="w-full animate-pulse rounded-t-sm bg-black"
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
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-white text-black">
      <WaveformBackground />
      <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 translate-x-1/3 -translate-y-1/4 transform rounded-full bg-[#B30000]/5 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-1/2 -translate-x-1/4 translate-y-1/4 transform rounded-full bg-blue-900/5 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-10 md:px-24">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-[2px] w-8 bg-[#B30000]" />
          <span className="text-xs font-bold tracking-[0.3em] text-[#B30000] uppercase md:text-sm">
            {CHART_NAME} Charts
          </span>
        </div>

        <h1 className="mb-8 text-5xl leading-[0.85] font-black tracking-tighter uppercase sm:text-7xl md:text-[8rem]">
          The Data
          <br />
          <span className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent">
            Of Sound.
          </span>
        </h1>

        <p className="mb-10 max-w-xl text-lg leading-relaxed font-medium text-gray-500 md:text-xl">
          An algorithmic tracking system designed to visualize your listening habits and build your
          own Hot 100.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/charts/live"
            className="group flex items-center justify-center gap-3 bg-[#B30000] px-6 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-red-900/10 transition-all hover:scale-105 hover:bg-red-800 active:scale-95"
          >
            <Activity className="h-5 w-5" />
            Live Chart
            <ArrowRight className="-ml-4 h-4 w-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
          </Link>

          <Link
            href="/charts/weekly"
            className="group flex items-center justify-center gap-3 bg-black px-6 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 hover:bg-gray-800 active:scale-95"
          >
            <Calendar className="h-5 w-5" />
            Weekly Charts
            <ArrowRight className="-ml-4 h-4 w-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden border-t border-gray-200 bg-white/80 py-2.5 backdrop-blur-md">
        <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap opacity-40">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="border-r border-gray-300 px-8 font-mono text-[10px] font-bold tracking-[0.3em] text-gray-900 uppercase"
            >
              What's your #1 Hit? • What are you listening to? • Do you know your music history?
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
