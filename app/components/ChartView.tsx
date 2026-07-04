"use client";

import { useState, useRef } from "react";
import ChartRow from "./ChartRow";
import { DisplayEntry } from "@/types";
import { calculateMaxStats } from "@/utils/metrics";
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
import { CHART_NAME } from "@/config/constants";

export type ChartViewProps = {
  entries: DisplayEntry[];
  exportFileNamePrefix?: string;
  hideRankChangeColumn?: boolean;
  chartLabel?: string;
};

const WIDTH_MODES = [
  { id: "slim", icon: <Square size={16} strokeWidth={2.5} /> },
  { id: "normal", icon: <Columns size={16} strokeWidth={2.5} /> },
  { id: "wide", icon: <Maximize size={16} strokeWidth={2.5} /> },
] as const;

export default function ChartView({
  entries,
  exportFileNamePrefix = "ChartExport",
  hideRankChangeColumn = false,
  chartLabel,
}: ChartViewProps) {
  const [layoutWidth, setLayoutWidth] = useState<"slim" | "normal" | "wide">("normal");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isExporting, setIsExporting] = useState(false);

  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [exportChunk, setExportChunk] = useState<DisplayEntry[]>([]);

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
    const primary = entry.primaryText?.toLowerCase() || "";
    const secondary = entry.secondaryText?.toLowerCase() || "";
    return primary.includes(term) || secondary.includes(term);
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
          saveAs(dataUrl, `${exportFileNamePrefix}_${startRank}-${endRank}.png`);
        }
      } else {
        setExportChunk(entries);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const dataUrl = await htmlToImage.toPng(exportContainerRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });

        saveAs(dataUrl, `${exportFileNamePrefix}_Grid.png`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export images. Check console for details.");
    } finally {
      setExportChunk([]);
      setIsExporting(false);
    }
  };

  const maxStats = entries ? calculateMaxStats(entries) : { sales: 0, streams: 0, airplay: 0, units: 0 };

  return (
    <div className="relative">
      <div
        className={`mx-auto flex items-center justify-between p-4 px-8 transition-all duration-300 ease-in-out ${getContainerWidth()}`}
      >
        <div className="relative flex items-center text-gray-400">
          <Search size={14} strokeWidth={2.5} className="pointer-events-none absolute left-3" />
          <input
            type="text"
            placeholder="Filter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 rounded-lg border border-gray-300 bg-white py-1.5 pr-8 pl-9 text-xs font-bold tracking-wider text-gray-900 uppercase shadow-sm transition-all duration-300 placeholder:text-gray-400 focus:w-64 focus:ring-2 focus:ring-black focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-gray-400 transition-colors hover:text-[#B30000]"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1 text-gray-400 shadow-sm">
            <button
              title="List View"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-all ${viewMode === "list" ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
            >
              <List size={16} strokeWidth={2.5} />
            </button>
            <button
              title="Grid View"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-all ${viewMode === "grid" ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
            >
              <GridIcon size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1 text-gray-400 shadow-sm">
            {WIDTH_MODES.map((mode) => (
              <button
                key={mode.id}
                title={`${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)} Width`}
                onClick={() => setLayoutWidth(mode.id as "slim" | "normal" | "wide")}
                className={`rounded-md p-1.5 transition-all ${layoutWidth === mode.id ? "bg-white text-black shadow-sm" : "hover:text-black"}`}
              >
                {mode.icon}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center rounded-lg bg-black p-2 text-white shadow-sm transition-colors hover:bg-[#B30000] disabled:cursor-not-allowed disabled:opacity-50"
            title={viewMode === "list" ? "Export 4-Part Image Series" : "Export Grid Image"}
          >
            {isExporting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Download size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <div
        className={`mx-auto px-8 pb-12 transition-all duration-300 ease-in-out ${getContainerWidth()}`}
      >
        {filteredEntries && filteredEntries.length > 0 ? (
          viewMode === "list" ? (
            <div className="min-h-[500px] border-t-2 border-black bg-white text-sm shadow-sm">
              <div className="sticky top-[88px] z-10 grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] border-b border-gray-300 bg-gray-50 font-bold text-gray-600">
                <div className="py-2 text-center">Rank</div>
                <div className="py-2 text-center">{hideRankChangeColumn ? "" : "+/-"}</div>
                <div className="py-2 pl-2">Song</div>
                <div className="py-2 text-center">{}</div>
                <div className="py-2 text-center">Points</div>
                <div className="py-2 text-center">%</div>
                <div className="bg-blue-50/50 py-2 text-center">Peak</div>
                <div className="py-2 text-center">WoC</div>
                <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">Sales</div>
                <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">%</div>
                <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">Streams</div>
                <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">%</div>
                <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">Airplay</div>
                <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">%</div>
                <div className="bg-[#eddcfe] py-2 text-center text-[#721a46]">Units</div>
              </div>
              {filteredEntries.map((entry) => (
                <ChartRow
                  key={entry.id}
                  entry={entry}
                  week={chartLabel || "All-Time"}
                  maxStats={maxStats}
                />
              ))}
            </div>
          ) : (
            <div
              className={`grid gap-0 border-y-2 border-black transition-all duration-300 ease-in-out ${getGridCols()}`}
            >
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  {entry.coverUrl ? (
                    <img
                      src={entry.coverUrl}
                      alt={entry.primaryText}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                      <span>No Cover</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-black px-2 py-0.5 text-xs font-black text-white shadow-sm">
                    {entry.rank}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="border-t-2 border-black py-12 text-center font-bold tracking-widest text-gray-400 uppercase">
            No matching chart records found.
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute top-[-9999px] left-[-9999px] opacity-0"
        style={{ width: "1200px" }}
      >
        <div ref={exportContainerRef} className="bg-white p-12 text-sm text-gray-900">
          <div className="mb-4 flex items-end justify-between border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{CHART_NAME} Charts</h1>
            <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              {chartLabel || exportFileNamePrefix.split("_").pop()}
            </p>
          </div>

          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] border-b border-gray-300 bg-gray-50 font-bold text-gray-600">
                <div className="py-2 text-center">Rank</div>
                <div className="py-2 text-center">{hideRankChangeColumn ? "" : "+/-"}</div>
                <div className="py-2 pl-2">Song</div>
                <div className="py-2 text-center">{}</div>
                <div className="py-2 text-center">Points</div>
                <div className="py-2 text-center">%</div>
                <div className="bg-blue-50/50 py-2 text-center">Peak</div>
                <div className="py-2 text-center">WoC</div>
                <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">Sales</div>
                <div className="bg-[#fff7d6] py-2 text-center text-[#7e3d01]">%</div>
                <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">Streams</div>
                <div className="bg-[#f0ffe0] py-2 text-center text-[#274f13]">%</div>
                <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">Airplay</div>
                <div className="bg-[#cdecff] py-2 text-center text-[#024da0]">%</div>
                <div className="bg-[#eddcfe] py-2 text-center text-[#721a46]">Units</div>
              </div>
              {exportChunk.map((entry) => (
                <ChartRow key={entry.id} entry={entry} week={entry.id} maxStats={maxStats} />
              ))}
            </>
          ) : (
            <div className="grid grid-cols-10 gap-0 border-y-2 border-black">
              {exportChunk.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  {entry.coverUrl ? (
                    <img
                      src={entry.coverUrl}
                      alt={entry.primaryText}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                      <span>No Cover</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-black px-2 py-0.5 text-xs font-black text-white shadow-sm">
                    {entry.rank}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
