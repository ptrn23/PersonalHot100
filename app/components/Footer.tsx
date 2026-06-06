"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f5f5f5] text-black border-t border-gray-300 mt-auto antialiased">
      <div className="max-w-[1400px] mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-center md:items-start">
        <div className="md:col-span-4 flex justify-center md:justify-start">
          <img
            src="/cover.jpg"
            alt="Magazine Cover"
            className="w-full aspect-video object-cover shadow-lg border border-gray-300 rounded-sm hover:shadow-xl transition-shadow duration-300"
          />
        </div>

        <div className="md:col-span-4 flex flex-col h-full justify-between">
          <div>
            <h4 className="font-black uppercase text-xs tracking-wider text-gray-900 mb-2">
              PERSONAL CHARTS
            </h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
              Personal Charts is an algorithmic music tracking system inspired
              by the Billboard Hot 100. By using Last.fm scrobble data, the
              engine computes music performance, simulating real-life chart
              mechanics through weights, multipliers, and time-decay logic.
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-white/50 text-[11px] font-bold uppercase tracking-wider text-gray-600 flex flex-col gap-1.5">
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span>Data Pipeline:</span>{" "}
              <span className="font-mono text-black">last.fm</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span>Database:</span>{" "}
              <span className="font-mono text-black">PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Architecture:</span>{" "}
              <span className="font-mono text-black">Next.js App Router</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-black uppercase text-xs tracking-wider text-gray-900 mb-4">
            SITEMAP
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs font-bold text-gray-600 uppercase tracking-wide">
            <li>
              <Link
                href="/charts/weekly"
                className="hover:text-[#B30000] transition-colors"
              >
                Hot 100
              </Link>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">
                Top Albums 20
              </span>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">
                Artist 20
              </span>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">Archive</span>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">About</span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-black uppercase text-xs tracking-wider text-gray-900 mb-4">
            ARCHITECTURE
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide font-mono">
            <li>Next.js v15</li>
            <li>Tailwind CSS v4</li>
            <li>Supabase Client</li>
            <li>Postgres Cluster</li>
            <li>Last.fm API V2</li>
          </ul>
        </div>
      </div>

      <div className="w-full bg-white border-t border-gray-200 py-4 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Personal Charts Logo"
              className="h-6 w-auto aspect-square object-cover transition-shadow duration-300"
            />
            <span className="font-medium text-gray-400 border-l border-gray-300 pl-3">
              © {new Date().getFullYear()} Personal Charts Inc. All Rights
              Reserved.
            </span>
          </div>

          <div className="font-mono font-medium text-gray-400 flex items-center gap-2">
            <svg
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3 text-black"
            >
              <path
                d="M37.5274 0L75.0548 65H0L37.5274 0Z"
                fill="currentColor"
              />
            </svg>
            DEPLOYED ON VERCEL
          </div>
        </div>
      </div>
    </footer>
  );
}
