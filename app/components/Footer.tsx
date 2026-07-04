"use client";

import Link from "next/link";

import { Triangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-300 bg-[#f5f5f5] text-black antialiased">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-8 py-12 md:grid-cols-12 md:items-start">
        <div className="flex justify-center md:col-span-4 md:justify-start">
          <img
            src="/cover.jpg"
            alt="Magazine Cover"
            className="aspect-video w-full rounded-sm border border-gray-300 object-cover shadow-lg transition-shadow duration-300 hover:shadow-xl"
          />
        </div>

        <div className="flex h-full flex-col justify-between md:col-span-4">
          <div>
            <h4 className="mb-2 text-xs font-black tracking-wider text-gray-900 uppercase">
              PERSONAL CHARTS
            </h4>
            <p className="mb-4 text-xs leading-relaxed font-medium text-gray-500">
              Personal Charts is an algorithmic music tracking system inspired by the Billboard Hot
              100. By using Last.fm scrobble data, the engine computes music performance, simulating
              real-life chart mechanics through weights, multipliers, and time-decay logic.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded border border-gray-300 bg-white/50 p-3 text-[11px] font-bold tracking-wider text-gray-600 uppercase">
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span>Data Pipeline:</span> <span className="font-mono text-black">last.fm</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span>Database:</span> <span className="font-mono text-black">PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Architecture:</span>{" "}
              <span className="font-mono text-black">Next.js App Router</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="mb-4 text-xs font-black tracking-wider text-gray-900 uppercase">
            SITEMAP
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs font-bold tracking-wide text-gray-600 uppercase">
            <li>
              <Link href="/charts/weekly" className="transition-colors hover:text-[#B30000]">
                Hot 100
              </Link>
            </li>
            <li>
              <Link href="/charts/albums" className="transition-colors hover:text-[#B30000]">
                Top Albums 20
              </Link>
            </li>
            <li>
              <Link href="/charts/artists" className="transition-colors hover:text-[#B30000]">
                Top Artists 20
              </Link>
            </li>
            <li>
              <Link href="/library" className="transition-colors hover:text-[#B30000]">
                Library
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition-colors hover:text-[#B30000]">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="mb-4 text-xs font-black tracking-wider text-gray-900 uppercase">
            ARCHITECTURE
          </h4>
          <ul className="flex flex-col gap-2.5 font-mono text-xs font-bold tracking-wide text-gray-400 uppercase">
            <li>Next.js v15</li>
            <li>Tailwind CSS v4</li>
            <li>Supabase Client</li>
            <li>Postgres Cluster</li>
            <li>Last.fm API V2</li>
          </ul>
        </div>
      </div>

      <div className="w-full border-t border-gray-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Personal Charts Logo"
              className="aspect-square h-6 w-auto object-cover transition-shadow duration-300"
            />
            <span className="border-l border-gray-300 pl-3 font-medium text-gray-400">
              © {new Date().getFullYear()} Personal Charts Inc. All Rights Reserved.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono font-medium text-gray-400">
            <Triangle className="h-3 w-3 fill-black text-black" />
            DEPLOYED ON VERCEL
          </div>
        </div>
      </div>
    </footer>
  );
}
