"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    // 🚨 STICKY WRAPPER: Fixed to top, z-index set high so charts scroll cleanly underneath
    <div className="sticky top-0 z-50 w-full flex flex-col shadow-sm select-none antialiased">
      {/* 1. TOP WHITE LAYER (Personal Charts / Core Nav) */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
          {/* Brand Logo - Changed from "Personal Hot 100" to "Personal Charts" */}
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none hover:opacity-80 transition-opacity">
              Personal <span className="text-[#B30000]">Charts</span>
            </h1>
          </Link>

          {/* Center: Main Navigation (Charts, Archive, About) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-black uppercase tracking-wider">
            <Link
              href="/"
              className={`transition-colors ${isActive("/") ? "text-[#B30000]" : "text-gray-600 hover:text-black"}`}
            >
              Charts
            </Link>
            <span className="text-gray-300 font-medium">/</span>
            <span className="text-gray-400 cursor-not-allowed">Archive</span>
            <span className="text-gray-300 font-medium">/</span>
            <span className="text-gray-400 cursor-not-allowed">About</span>
          </nav>

          {/* Right Side: Login | Update Auth Blocks */}
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
            <span className="cursor-not-allowed hover:text-[#B30000] transition-colors">
              Login
            </span>
            <span className="text-gray-300 font-medium">|</span>
            <span className="cursor-not-allowed hover:text-[#B30000] transition-colors">
              Update
            </span>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM BLACK LAYER (Hot 100, Top Albums 20, Artist 20, Year-End Charts, All-Time) */}
      <div className="w-full bg-black text-white py-2.5 overflow-x-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-start md:justify-center items-center gap-6 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em]">
          {/* Changed to only say "Hot 100" */}
          <Link
            href="/"
            className="hover:text-[#B30000] transition-colors text-white"
          >
            Hot 100
          </Link>

          <span className="text-gray-800 font-medium">|</span>

          <span className="text-gray-500 cursor-not-allowed">
            Top Albums 20
          </span>

          <span className="text-gray-800 font-medium">|</span>

          <span className="text-gray-500 cursor-not-allowed">Artist 20</span>

          <span className="text-gray-800 font-medium">|</span>

          <span className="text-gray-500 cursor-not-allowed">
            Year-End Charts
          </span>

          <span className="text-gray-800 font-medium">|</span>

          <span className="text-gray-500 cursor-not-allowed">All-Time</span>
        </div>
      </div>
    </div>
  );
}
