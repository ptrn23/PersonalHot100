"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Loader2, X, ChevronDown } from "lucide-react";
import { CHART_NAME } from "@/config/constants";

import { performGlobalSearch } from "@/lib/db/search";

export default function Header() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<{
    artists: any[];
    albums: any[];
    songs: any[];
  }>({
    artists: [],
    albums: [],
    songs: [],
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const isActive = (path: string) => pathname.startsWith(path);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ artists: [], albums: [], songs: [] });
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);

      try {
        const searchData = await performGlobalSearch(query);
        setResults(searchData);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleLinkClick = () => {
    setShowDropdown(false);
    setQuery("");
  };

  return (
    <div className="sticky top-0 z-50 flex w-full flex-col antialiased shadow-sm select-none">
      <div className="relative w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl leading-none font-black tracking-tighter uppercase transition-opacity hover:opacity-80">
              {CHART_NAME} <span className="text-[#B30000]">Charts</span>
            </h1>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black tracking-wider uppercase lg:flex">
            <Link
              href="/charts"
              className={`transition-none hover:underline decoration-[#B30000] decoration-2 underline-offset-[6px] ${
                isActive("/charts") ? "underline decoration-[#B30000] decoration-2 underline-offset-[6px]" : "text-gray-900"
              }`}
            >
              Charts
            </Link>

            <span className="font-medium text-gray-300">/</span>

            <Link
              href="/library"
              className={`transition-none hover:underline decoration-[#B30000] decoration-2 underline-offset-[6px] ${
                isActive("/library") ? "underline decoration-[#B30000] decoration-2 underline-offset-[6px]" : "text-gray-900"
              }`}
            >
              Library
            </Link>

            <span className="font-medium text-gray-300">/</span>

            <Link
              href="/about"
              className={`transition-none hover:underline decoration-[#B30000] decoration-2 underline-offset-[6px] ${
                isActive("/about") ? "underline decoration-[#B30000] decoration-2 underline-offset-[6px]" : "text-gray-900"
              }`}
            >
              About
            </Link>
          </nav>

          <div className="relative flex items-center" ref={searchRef}>
            <div className="relative">
              <Search
                size={14}
                strokeWidth={3}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
              />
              <input
                type="text"
                placeholder="SEARCH..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (query.trim()) setShowDropdown(true);
                }}
                className="w-48 rounded-sm border-2 border-black bg-gray-100 py-2 pr-8 pl-9 text-xs font-bold tracking-widest text-gray-900 uppercase transition-all duration-300 placeholder:text-gray-400 focus:w-64 focus:ring-0 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-[#B30000]"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 flex w-80 flex-col overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isSearching ? (
                  <div className="flex items-center justify-center p-8 text-[#B30000]">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {/* Artists Section */}
                    {results.artists.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-black px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                          Artists
                        </div>
                        <div className="flex flex-col">
                          {results.artists.map((artist) => (
                            <Link
                              key={artist.id}
                              href={`/library/artist/${artist.id}`}
                              onClick={handleLinkClick}
                              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-200">
                                {artist.image_url ? (
                                  <img
                                    src={artist.image_url}
                                    alt={artist.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-black text-gray-500">
                                    {artist.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="truncate text-sm font-bold">{artist.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums Section */}
                    {results.albums.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-black px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                          Albums
                        </div>
                        <div className="flex flex-col">
                          {results.albums.map((album) => (
                            <Link
                              key={album.id}
                              href={`/library/album/${album.id}`}
                              onClick={handleLinkClick}
                              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-gray-300 bg-gray-200">
                                {album.cover_url ? (
                                  <img
                                    src={album.cover_url}
                                    alt={album.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[8px] font-black text-gray-400">ALB</span>
                                )}
                              </div>
                              <span className="truncate text-sm font-bold">{album.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Songs Section */}
                    {results.songs.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-[#B30000] px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                          Songs
                        </div>
                        <div className="flex flex-col">
                          {results.songs.map((song) => (
                            <Link
                              key={song.id}
                              href={`/library/song/${song.id}`}
                              onClick={handleLinkClick}
                              className="flex flex-col px-3 py-2 transition-colors hover:bg-gray-50"
                            >
                              <span className="truncate text-sm font-bold text-gray-900">
                                {song.display_title || song.title}
                              </span>
                              <span className="truncate text-xs font-medium text-gray-500">
                                {(song.artists as any)?.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {!isSearching &&
                      results.artists.length === 0 &&
                      results.albums.length === 0 &&
                      results.songs.length === 0 && (
                        <div className="p-6 text-center text-xs font-bold tracking-widest text-gray-400 uppercase">
                          No matches found.
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-visible bg-black text-white">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-start gap-6 px-6 text-[11px] font-black tracking-[0.18em] whitespace-nowrap uppercase md:justify-center">
          
          {/* HOT 100 DROPDOWN */}
          <div className="group relative flex h-full items-center">
            <button className="flex h-full items-center gap-1 transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
              Hot 100 <ChevronDown size={12} strokeWidth={3} />
            </button>
            <div className="absolute top-full left-0 hidden w-48 flex-col border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:flex">
              <Link href="/charts/weekly" className="border-b-2 border-black px-4 py-3 text-black hover:bg-gray-200">
                Weekly Chart
              </Link>
              <Link href="/charts/live" className="px-4 py-3 text-black hover:bg-gray-200">
                Live Tracker
              </Link>
            </div>
          </div>

          <span className="font-medium text-gray-800">|</span>

          {/* METRICS DROPDOWN */}
          <div className="group relative flex h-full items-center">
            <button className="flex h-full items-center gap-1 transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
              Metrics <ChevronDown size={12} strokeWidth={3} />
            </button>
            <div className="absolute top-full left-0 hidden w-48 flex-col border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:flex">
              <Link href="/charts/streamify" className="border-b-2 border-black px-4 py-3 text-black hover:bg-green-100">
                Streamify
              </Link>
              <Link href="/charts/isales" className="border-b-2 border-black px-4 py-3 text-black hover:bg-yellow-100">
                iSales
              </Link>
              <Link href="/charts/airfm" className="px-4 py-3 text-black hover:bg-blue-100">
                Air.FM
              </Link>
            </div>
          </div>

          <span className="font-medium text-gray-800">|</span>

          <Link href="/charts/albums" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            Top Albums 20
          </Link>
          
          <span className="font-medium text-gray-800">|</span>
          
          <Link href="/charts/artists" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            Top Artists 20
          </Link>
          
          <span className="font-medium text-gray-800">|</span>
          
          <Link href="/charts/year-end" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            Year-End Charts
          </Link>
          
          <span className="font-medium text-gray-800">|</span>
          
          <Link href="/charts/alltime" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            All-Time
          </Link>
          
          <span className="font-medium text-gray-800">|</span>
          
          <Link href="/certifications" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            Certifications
          </Link>
          
          <span className="font-medium text-gray-800">|</span>
          
          <Link href="/records" className="transition-none hover:underline decoration-white decoration-2 underline-offset-[6px]">
            Records
          </Link>

        </div>
      </div>
    </div>
  );
}
