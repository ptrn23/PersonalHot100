"use client";

import { useState, useRef } from "react";
import ChartRow, {
  ChartEntry,
  MaxStats,
  getStableSeed,
  applyDeviation,
} from "./ChartRow";
import WeekSelector from "./WeekSelector";
import {
  Search,
  X,
  List,
  Grid as GridIcon,
  Square,
  Columns,
  Maximize,
  Download,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";

type Props = {
  entries: ChartEntry[] | null;
  availableWeeks: string[];
  activeWeekDate: string;
  formattedDateRange: string;
};

const WIDTH_MODES = [
  { id: "slim", icon: <Square size={16} strokeWidth={2.5} /> },
  { id: "normal", icon: <Columns size={16} strokeWidth={2.5} /> },
  { id: "wide", icon: <Maximize size={16} strokeWidth={2.5} /> },
] as const;

export default function ChartView({
  entries,
  availableWeeks,
  activeWeekDate,
  formattedDateRange,
}: Props) {
  const [layoutWidth, setLayoutWidth] = useState<"slim" | "normal" | "wide">(
    "normal",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isExporting, setIsExporting] = useState(false);

  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [exportChunk, setExportChunk] = useState<ChartEntry[]>([]);

  const getContainerWidth = () => {
    switch (layoutWidth) {
      case "slim":
        return "max-w-[1200px] min-w-[1200px]";
      case "wide":
        return "max-w-[1750px] min-w-[1750px]";
      case "normal":
      default:
        return "max-w-[1450px] min-w-[1450px]";
    }
  };

  const getGridCols = () => {
    switch (layoutWidth) {
      case "wide":
        return "grid-cols-10";
      case "slim":
        return "grid-cols-4";
      case "normal":
      default:
        return "grid-cols-5";
    }
  };

  const filteredEntries = entries?.filter((entry) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const songTitle = entry.songs?.title?.toLowerCase() || "";
    const artistName = entry.songs?.artists?.name?.toLowerCase() || "";
    const albumTitle = entry.songs?.albums?.title?.toLowerCase() || "";
    return (
      songTitle.includes(term) ||
      artistName.includes(term) ||
      albumTitle.includes(term)
    );
  });

  const handleExport = async () => {
    if (!entries || entries.length === 0 || !exportContainerRef.current) return;
    setIsExporting(true);

    try {
      if (viewMode === "list") {
        const chunks = [];
        for (let i = 0; i < entries.length; i += 25) {
          chunks.push(entries.slice(i, i + 25));
        }

        for (let i = 0; i < chunks.length; i++) {
          setExportChunk(chunks[i]);
          await new Promise((resolve) => setTimeout(resolve, 500));

          const dataUrl = await htmlToImage.toPng(exportContainerRef.current, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });

          const startRank = i * 25 + 1;
          const endRank = startRank + chunks[i].length - 1;
          saveAs(
            dataUrl,
            `PH100_${activeWeekDate}_${startRank}-${endRank}.png`,
          );
        }
      } else {
        setExportChunk(entries);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const dataUrl = await htmlToImage.toPng(exportContainerRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });

        saveAs(dataUrl, `PH100_${activeWeekDate}_Grid.png`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export images. Check console for details.");
    } finally {
      setExportChunk([]);
      setIsExporting(false);
    }
  };

  const maxStats: MaxStats = { sales: 0, streams: 0, airplay: 0, units: 0 };

  if (entries) {
    entries.forEach((entry: ChartEntry) => {
      const title = entry.songs?.title || "";
      const artist = entry.songs?.artists?.name || "";
      const seed = getStableSeed(title, artist);

      const streamsUnits = applyDeviation(
        Math.floor(entry.streams * 5250 * 275),
        seed + 1,
      );
      const airplayUnits = applyDeviation(
        Math.floor(entry.airplay * 2250 * 5020),
        seed + 3,
      );
      const totalUnits = applyDeviation(
        Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
        seed + 4,
      );

      if (entry.sales > maxStats.sales) maxStats.sales = entry.sales;
      if (streamsUnits > maxStats.streams) maxStats.streams = streamsUnits;
      if (airplayUnits > maxStats.airplay) maxStats.airplay = airplayUnits;
      if (totalUnits > maxStats.units) maxStats.units = totalUnits;
    });
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-auto pb-24 relative">
      <div
        className={`mx-auto p-8 transition-all duration-300 ease-in-out ${getContainerWidth()}`}
      >
        <header className="mb-6 flex justify-between items-end px-2">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
              Hot 100
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">
              Week of {formattedDateRange}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="relative flex items-center text-gray-400">
              <Search
                size={14}
                strokeWidth={2.5}
                className="absolute left-3 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 focus:w-64 transition-all duration-300 bg-white border border-gray-300 text-gray-900 py-1.5 pl-9 pr-8 rounded-lg font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black shadow-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-gray-400 hover:text-[#B30000] transition-colors"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm text-gray-400">
              <button
                title="List View"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
              >
                <List size={16} strokeWidth={2.5} />
              </button>
              <button
                title="Grid View"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
              >
                <GridIcon size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm text-gray-400">
              {WIDTH_MODES.map((mode) => (
                <button
                  key={mode.id}
                  title={`${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)} Width`}
                  onClick={() =>
                    setLayoutWidth(mode.id as "slim" | "normal" | "wide")
                  }
                  className={`p-1.5 rounded-md transition-all ${layoutWidth === mode.id ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
                >
                  {mode.icon}
                </button>
              ))}
            </div>

            <WeekSelector weeks={availableWeeks} activeWeek={activeWeekDate} />

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center bg-black text-white p-2 rounded-lg hover:bg-[#B30000] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-2"
              title={
                viewMode === "list"
                  ? "Export 4-Part Image Series"
                  : "Export 10x10 Grid Image"
              }
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </header>

        {filteredEntries && filteredEntries.length > 0 ? (
          viewMode === "list" ? (
            <div className="text-sm border-t-2 border-black shadow-sm bg-white min-h-[500px]">
              <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50 sticky top-[88px] z-10">
                <div className="py-2 text-center">Rank</div>
                <div className="py-2 text-center">+/-</div>
                <div className="py-2 pl-2">Song</div>
                <div className="py-2 text-center">{}</div>
                <div className="py-2 text-center">Points</div>
                <div className="py-2 text-center">%</div>
                <div className="py-2 text-center bg-blue-50/50">Peak</div>
                <div className="py-2 text-center">WoC</div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  Sales
                </div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  %
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  Streams
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  %
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  Airplay
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  %
                </div>
                <div className="py-2 text-center text-[#721a46] bg-[#eddcfe]">
                  Units
                </div>
              </div>
              {filteredEntries.map((entry) => (
                <ChartRow key={entry.id} entry={entry} maxStats={maxStats} />
              ))}
            </div>
          ) : (
            <div
              className={`grid gap-0 border-y-2 border-black transition-all duration-300 ease-in-out ${getGridCols()}`}
            >
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="aspect-square bg-gray-100 overflow-hidden relative group"
                >
                  {entry.songs?.albums?.cover_url ? (
                    <img
                      src={entry.songs.albums.cover_url}
                      alt={entry.songs.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-bold uppercase text-[10px] bg-gray-50 border border-gray-200">
                      <span>No Cover</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-black text-white text-xs font-black px-2 py-0.5 shadow-sm">
                    {entry.rank}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest border-t-2 border-black">
            No matching chart records found.
          </div>
        )}
      </div>

      <div
        className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none"
        style={{ width: "1200px" }}
      >
        <div
          ref={exportContainerRef}
          className="bg-white p-12 text-sm text-gray-900"
        >
          <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Personal Charts
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              {formattedDateRange}
            </p>
          </div>

          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] font-bold text-gray-600 border-b border-gray-300 bg-gray-50">
                <div className="py-2 text-center">Rank</div>
                <div className="py-2 text-center">+/-</div>
                <div className="py-2 pl-2">Song</div>
                <div className="py-2 text-center">{}</div>
                <div className="py-2 text-center">Points</div>
                <div className="py-2 text-center">%</div>
                <div className="py-2 text-center bg-blue-50/50">Peak</div>
                <div className="py-2 text-center">WoC</div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  Sales
                </div>
                <div className="py-2 text-center text-[#7e3d01] bg-[#fff7d6]">
                  %
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  Streams
                </div>
                <div className="py-2 text-center text-[#274f13] bg-[#f0ffe0]">
                  %
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  Airplay
                </div>
                <div className="py-2 text-center text-[#024da0] bg-[#cdecff]">
                  %
                </div>
                <div className="py-2 text-center text-[#721a46] bg-[#eddcfe]">
                  Units
                </div>
              </div>
              {exportChunk.map((entry) => (
                <ChartRow key={entry.id} entry={entry} maxStats={maxStats} />
              ))}
            </>
          ) : (
            <div className="grid gap-0 border-y-2 border-black grid-cols-10">
              {exportChunk.map((entry) => (
                <div
                  key={entry.id}
                  className="aspect-square bg-gray-100 overflow-hidden relative group"
                >
                  {entry.songs?.albums?.cover_url ? (
                    <img
                      src={entry.songs.albums.cover_url}
                      alt={entry.songs.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-bold uppercase text-[10px] bg-gray-50 border border-gray-200">
                      <span>No Cover</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-black text-white text-xs font-black px-2 py-0.5 shadow-sm">
                    {entry.rank}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
