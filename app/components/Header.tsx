"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { supabase } from "@/utils/supabase";

export default function Header() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<{ artists: any[]; albums: any[]; songs: any[] }>({
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

      const [resArtists, resAlbums, resSongs] = await Promise.all([
        supabase.from("artists").select("id, name").ilike("name", `%${query}%`).limit(3),
        supabase.from("albums").select("id, title, cover_url").ilike("title", `%${query}%`).limit(3),
        supabase.from("songs").select("id, title, artists(name)").ilike("title", `%${query}%`).limit(5)
      ]);

      setResults({
        artists: resArtists.data || [],
        albums: resAlbums.data || [],
        songs: resSongs.data || [],
      });
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleLinkClick = () => {
    setShowDropdown(false);
    setQuery("");
  };

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col shadow-sm select-none antialiased">
      <div className="w-full bg-white border-b border-gray-200 relative">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
          
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none hover:opacity-80 transition-opacity">
              Personal <span className="text-[#B30000]">Charts</span>
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-4 text-sm font-black uppercase tracking-wider">
            <Link href="/" className={`transition-colors ${isActive("/") ? "text-[#B30000]" : "text-gray-600 hover:text-black"}`}>
              Charts
            </Link>
            <span className="text-gray-300 font-medium">/</span>
            <span className="text-gray-400 cursor-not-allowed">Library</span>
            <span className="text-gray-300 font-medium">/</span>
            <span className="text-gray-400 cursor-not-allowed">About</span>
          </nav>

          <div className="relative flex items-center" ref={searchRef}>
            <div className="relative">
              <Search size={14} strokeWidth={3} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="SEARCH..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim()) setShowDropdown(true); }}
                className="w-48 focus:w-64 transition-all duration-300 bg-gray-100 border border-gray-200 text-gray-900 py-2 pl-9 pr-8 rounded-sm font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#B30000] transition-colors">
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-black shadow-xl overflow-hidden flex flex-col">
                {isSearching ? (
                  <div className="p-8 flex justify-center items-center text-[#B30000]">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto">
                    
                    {/* Artists Section */}
                    {results.artists.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">Artists</div>
                        <div className="flex flex-col">
                          {results.artists.map((artist) => (
                            <Link key={artist.id} href={`/artist/${artist.id}`} onClick={handleLinkClick} className="px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                                <span className="font-black text-gray-500 text-xs">{artist.name.charAt(0)}</span>
                              </div>
                              <span className="font-bold text-sm truncate">{artist.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums Section */}
                    {results.albums.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">Albums</div>
                        <div className="flex flex-col">
                          {results.albums.map((album) => (
                            <Link key={album.id} href={`/album/${album.id}`} onClick={handleLinkClick} className="px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 shrink-0 border border-gray-300 flex items-center justify-center overflow-hidden">
                                {album.cover_url ? (
                                  <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-black text-gray-400 text-[8px]">ALB</span>
                                )}
                              </div>
                              <span className="font-bold text-sm truncate">{album.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Songs Section */}
                    {results.songs.length > 0 && (
                      <div className="border-b border-gray-100 last:border-0">
                        <div className="bg-[#B30000] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">Songs</div>
                        <div className="flex flex-col">
                          {results.songs.map((song) => (
                            <Link key={song.id} href={`/song/${song.id}`} onClick={handleLinkClick} className="px-3 py-2 hover:bg-gray-50 transition-colors flex flex-col">
                              <span className="font-bold text-sm truncate text-gray-900">{song.title}</span>
                              <span className="text-xs font-medium text-gray-500 truncate">{(song.artists as any)?.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {!isSearching && results.artists.length === 0 && results.albums.length === 0 && results.songs.length === 0 && (
                      <div className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
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

      <div className="w-full bg-black text-white py-2.5 overflow-x-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-start md:justify-center items-center gap-6 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em]">
          <Link href="/" className="hover:text-[#B30000] transition-colors text-white">
            Hot 100
          </Link>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">Top Albums 20</span>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">Artist 20</span>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">Year-End Charts</span>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">All-Time</span>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">Certifications</span>
          <span className="text-gray-800 font-medium">|</span>
          <span className="text-gray-500 cursor-not-allowed">Records</span>
        </div>
      </div>
    </div>
  );
}
