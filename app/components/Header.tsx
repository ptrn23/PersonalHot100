"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
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
  const isActive = (path: string) => pathname === path;

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

          <nav className="hidden items-center gap-4 text-sm font-black tracking-wider uppercase lg:flex">
            <Link
              href="/charts"
              className={`transition-colors ${
                pathname.startsWith("/charts") ? "text-[#B30000]" : "text-gray-600 hover:text-black"
              }`}
            >
              Charts
            </Link>

            <span className="font-medium text-gray-300">/</span>

            <Link
              href="/library"
              className={`transition-colors ${
                pathname.startsWith("/library")
                  ? "text-[#B30000]"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Library
            </Link>

            <span className="font-medium text-gray-300">/</span>

            <Link
              href="/about"
              className={`transition-colors ${
                pathname === "/about" ? "text-[#B30000]" : "text-gray-600 hover:text-black"
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
                className="w-48 rounded-sm border border-gray-200 bg-gray-100 py-2 pr-8 pl-9 text-xs font-bold tracking-widest text-gray-900 uppercase transition-all duration-300 placeholder:text-gray-400 focus:w-64 focus:ring-2 focus:ring-black focus:outline-none"
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
              <div className="absolute top-full right-0 mt-2 flex w-80 flex-col overflow-hidden border-2 border-black bg-white shadow-xl">
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

      <div className="w-full overflow-x-auto bg-black py-2.5 text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-start gap-6 px-6 text-[11px] font-black tracking-[0.18em] whitespace-nowrap uppercase md:justify-center">
          <Link href="/charts/weekly" className="text-white transition-colors hover:text-[#B30000]">
            Hot 100
          </Link>
          <span className="font-medium text-gray-800">|</span>
          <Link href="/charts/albums" className="text-white transition-colors hover:text-[#B30000]">
            Top Albums 20
          </Link>
          <span className="font-medium text-gray-800">|</span>
          <Link
            href="/charts/artists"
            className="text-white transition-colors hover:text-[#B30000]"
          >
            Top Artists 20
          </Link>
          <span className="font-medium text-gray-800">|</span>
          <Link
            href="/charts/year-end"
            className="text-white transition-colors hover:text-[#B30000]"
          >
            Year-End Charts
          </Link>
          <span className="font-medium text-gray-800">|</span>
          <Link
            href="/charts/alltime"
            className="text-white transition-colors hover:text-[#B30000]"
          >
            All-Time
          </Link>
          <span className="font-medium text-gray-800">|</span>
          <span className="cursor-not-allowed text-gray-500">Certifications</span>
          <span className="font-medium text-gray-800">|</span>
          <Link
            href="/charts/records"
            className="text-white transition-colors hover:text-[#B30000]"
          >
            Records
          </Link>
        </div>
      </div>
    </div>
  );
}
