"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Triangle } from "lucide-react";
import { CHART_NAME } from "@/config/constants";

export default function Footer() {
  const pathname = usePathname();

  const isStreamify = pathname.startsWith("/charts/streamify");
  const isIsales = pathname.startsWith("/charts/isales");
  const isAirfm = pathname.startsWith("/charts/airfm");

  const t = {
    bg: isStreamify
      ? "bg-[#121212]"
      : isIsales
        ? "bg-[#fef3c7]"
        : isAirfm
          ? "bg-[#090d16]"
          : "bg-[#f5f5f5]",
    border: isStreamify
      ? "border-zinc-800"
      : isIsales
        ? "border-black"
        : isAirfm
          ? "border-blue-900"
          : "border-gray-300",
    textMain: isStreamify
      ? "text-white"
      : isIsales
        ? "text-black"
        : isAirfm
          ? "text-white"
          : "text-black",
    textMuted: isStreamify
      ? "text-gray-400"
      : isIsales
        ? "text-gray-700"
        : isAirfm
          ? "text-blue-300/70"
          : "text-gray-500",
    textAccent: isStreamify
      ? "text-[#1ed760]"
      : isIsales
        ? "text-amber-600"
        : isAirfm
          ? "text-blue-400"
          : "text-gray-900",
    boxBg: isStreamify
      ? "bg-zinc-900"
      : isIsales
        ? "bg-white/60"
        : isAirfm
          ? "bg-[#0f172a]"
          : "bg-white/50",
    boxBorder: isStreamify
      ? "border-zinc-800"
      : isIsales
        ? "border-black"
        : isAirfm
          ? "border-blue-900/50"
          : "border-gray-300",
    hover: isStreamify
      ? "hover:text-[#1ed760]"
      : isIsales
        ? "hover:text-amber-500"
        : isAirfm
          ? "hover:text-blue-400"
          : "hover:text-[#B30000]",
    subBg: isStreamify
      ? "bg-[#0a0a0a]"
      : isIsales
        ? "bg-amber-400"
        : isAirfm
          ? "bg-[#05080e]"
          : "bg-white",
    subBorder: isStreamify
      ? "border-zinc-900"
      : isIsales
        ? "border-black"
        : isAirfm
          ? "border-blue-900/50"
          : "border-gray-200",
    subText: isStreamify
      ? "text-gray-500"
      : isIsales
        ? "text-black"
        : isAirfm
          ? "text-blue-500"
          : "text-gray-400",
    triangle: isStreamify
      ? "fill-gray-500 text-gray-500"
      : isIsales
        ? "fill-black text-black"
        : isAirfm
          ? "fill-blue-500 text-blue-500"
          : "fill-black text-black",
  };

  return (
    <footer
      className={`mt-auto w-full border-t antialiased transition-colors duration-300 ${t.border} ${t.bg} ${t.textMain}`}
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-8 py-12 md:grid-cols-12 md:items-start">
        <div className="flex justify-center md:col-span-4 md:justify-start">
          <img
            src="/cover.jpg"
            alt="Magazine Cover"
            className={`aspect-video w-full rounded-sm border object-cover shadow-lg transition-shadow duration-300 hover:shadow-xl ${t.boxBorder}`}
          />
        </div>

        <div className="flex h-full flex-col justify-between md:col-span-4">
          <div>
            <h4 className={`mb-2 text-xs font-black tracking-wider uppercase ${t.textAccent}`}>
              {CHART_NAME} CHARTS
            </h4>
            <p className={`mb-4 text-xs leading-relaxed font-medium ${t.textMuted}`}>
              {CHART_NAME} Charts is an algorithmic music tracking system inspired by the Billboard
              Hot 100. By using Last.fm scrobble data, the engine computes music performance,
              simulating real-life chart mechanics through weights, multipliers, and time-decay
              logic.
            </p>
          </div>
          <div
            className={`flex flex-col gap-1.5 rounded border p-3 text-[11px] font-bold tracking-wider uppercase ${t.boxBg} ${t.boxBorder} ${t.textMuted}`}
          >
            <div className={`flex justify-between border-b pb-1 ${t.boxBorder}`}>
              <span>Data Pipeline:</span> <span className={`font-mono ${t.textMain}`}>last.fm</span>
            </div>
            <div className={`flex justify-between border-b pb-1 ${t.boxBorder}`}>
              <span>Database:</span> <span className={`font-mono ${t.textMain}`}>PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Architecture:</span>{" "}
              <span className={`font-mono ${t.textMain}`}>Next.js App Router</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className={`mb-4 text-xs font-black tracking-wider uppercase ${t.textAccent}`}>
            SITEMAP
          </h4>
          <ul
            className={`flex flex-col gap-2.5 text-xs font-bold tracking-wide uppercase ${t.textMuted}`}
          >
            <li>
              <Link href="/charts/weekly" className={`transition-colors ${t.hover}`}>
                Hot 100
              </Link>
            </li>
            <li>
              <Link href="/charts/albums" className={`transition-colors ${t.hover}`}>
                Top Albums 20
              </Link>
            </li>
            <li>
              <Link href="/charts/artists" className={`transition-colors ${t.hover}`}>
                Top Artists 20
              </Link>
            </li>
            <li>
              <Link href="/library" className={`transition-colors ${t.hover}`}>
                Library
              </Link>
            </li>
            <li>
              <Link href="/about" className={`transition-colors ${t.hover}`}>
                About
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className={`mb-4 text-xs font-black tracking-wider uppercase ${t.textAccent}`}>
            ARCHITECTURE
          </h4>
          <ul
            className={`flex flex-col gap-2.5 font-mono text-xs font-bold tracking-wide uppercase ${t.textMuted}`}
          >
            <li>Next.js v15</li>
            <li>Tailwind CSS v4</li>
            <li>Supabase Client</li>
            <li>Postgres Cluster</li>
            <li>Last.fm API V2</li>
          </ul>
        </div>
      </div>

      <div
        className={`w-full border-t px-8 py-4 transition-colors duration-300 ${t.subBg} ${t.subBorder}`}
      >
        <div
          className={`mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-[10px] font-bold tracking-widest uppercase sm:flex-row ${t.subText}`}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt={`${CHART_NAME} Charts Logo`}
              className="aspect-square h-6 w-auto object-cover transition-shadow duration-300"
            />
            <span className={`border-l pl-3 font-medium ${t.subBorder}`}>
              © {new Date().getFullYear()} {CHART_NAME} Charts Inc. All Rights Reserved.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono font-medium">
            <Triangle className={`h-3 w-3 ${t.triangle}`} />
            DEPLOYED ON VERCEL
          </div>
        </div>
      </div>
    </footer>
  );
}
