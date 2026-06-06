"use client";

import { useState, useRef } from "react";
import ChartTicket from "./ChartTicket";
// import FeedTooltip from './FeedTooltip';
import Link from "next/link";
import { Share2, Ticket, X, LineChart, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

const formatNumber = (num: number) => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

export const getStableSeed = (title: string, artist: string) => {
  const combo = `${title}|${artist}`;
  let hash = 0;
  for (let i = 0; i < combo.length; i++) {
    hash += (i + 1) * combo.charCodeAt(i);
  }
  return hash;
};

export const applyDeviation = (
  base: number,
  seed: number,
  scale = 0.1,
  mod = 100,
) => {
  const deviation = ((seed % mod) / mod - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};

export type MaxStats = {
  sales: number;
  streams: number;
  airplay: number;
  units: number;
};

export type ChartEntry = {
  id: string;
  rank: number;
  previous_position: number | null;
  is_new_peak: boolean;
  is_repeak: boolean;
  peak_position: number;
  weeks_on_chart: number;
  total_points: number;
  current_week_points: number;
  previous_week_raw_points: number | null;
  two_weeks_ago_raw_points: number | null;
  peak_streak: number | null;
  sales: number;
  streams: number;
  airplay: number;
  disableSongLink?: boolean;
  overrideSubLabel?: string;
  songs?: {
    id: string;
    title: string;
    display_title?: string | null;
    artists?: {
      name: string;
      display_name?: string | null;
      id: string;
      customHref?: string;
    };
    albums?: {
      title?: string;
      display_title?: string | null;
      id: string;
      cover_url?: string;
    };
  };
};

export default function ChartRow({
  entry,
  maxStats,
  week,
}: {
  entry: ChartEntry;
  maxStats: MaxStats;
  week: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${song.artist.replace(/\s+/g, "-")}-${song.title.replace(/\s+/g, "-")}-Hot100.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export ticket", err);
    } finally {
      setIsExporting(false);
    }
  };

  const title = entry.songs?.display_title || entry.songs?.title || "Unknown";
  const artist =
    entry.songs?.artists?.display_name ||
    entry.songs?.artists?.name ||
    "Unknown";
  const displaySubLabel = entry.overrideSubLabel || artist;
  const seed = getStableSeed(title, artist);
  const streamsUnits = applyDeviation(
    Math.floor(entry.streams * 5250 * 275),
    seed + 1,
  );
  const salesUnits = applyDeviation(Math.floor(entry.sales * 252), seed + 2);
  const airplayUnits = applyDeviation(
    Math.floor(entry.airplay * 2250 * 5020),
    seed + 3,
  );
  const totalUnits = applyDeviation(
    Math.floor((entry.streams + entry.sales + entry.airplay) * 1750 * 2),
    seed + 4,
  );

  const prevRaw = entry.previous_week_raw_points || 0;
  const twoWeeksRaw = entry.two_weeks_ago_raw_points || 0;

  const totalRawForPct =
    entry.streams * 4 + entry.sales * 0.45 + entry.airplay * 5;

  const streamsPct =
    totalRawForPct > 0
      ? Math.round(((entry.streams * 4) / totalRawForPct) * 100) + "%"
      : "0%";

  const salesPct =
    totalRawForPct > 0
      ? Math.round(((entry.sales * 0.45) / totalRawForPct) * 100) + "%"
      : "0%";

  const airplayPct =
    totalRawForPct > 0
      ? Math.round(((entry.airplay * 5) / totalRawForPct) * 100) + "%"
      : "0%";

  let pointsPctStr = "--";
  if (prevRaw > 0) {
    const pctChange = ((entry.total_points - prevRaw) / prevRaw) * 100;
    pointsPctStr = (pctChange > 0 ? "+" : "") + Math.round(pctChange);
  }

  const song = {
    rank: entry.rank,
    title: title,
    artist: artist,
    artistId: entry.songs?.artists?.id,
    albumId: entry.songs?.albums?.id,
    coverUrl: entry.songs?.albums?.cover_url,

    status: !entry.previous_position
      ? entry.weeks_on_chart > 1
        ? "re"
        : "new"
      : entry.previous_position > entry.rank
        ? "rise"
        : entry.previous_position < entry.rank
          ? "fall"
          : "stable",
    change: entry.previous_position
      ? Math.abs(entry.previous_position - entry.rank)
      : 0,

    points: entry.total_points,
    pointsPct: pointsPctStr,
    peak: entry.peak_position,
    peakStreak: entry.peak_streak,
    isNewPeak: entry.is_new_peak,
    isRePeak: entry.is_repeak,
    woc: entry.weeks_on_chart,

    salesUnits: salesUnits,
    salesPct: salesPct,
    isTopSales: entry.sales > 0 && entry.sales === maxStats.sales,

    streamsUnits: streamsUnits,
    streamsPct: streamsPct,
    isTopStreams: entry.streams > 0 && streamsUnits === maxStats.streams,

    airplayUnits: airplayUnits,
    airplayPct: airplayPct,
    isTopAirplay: entry.airplay > 0 && airplayUnits === maxStats.airplay,

    units: totalUnits,
    isTopUnits: totalUnits > 0 && totalUnits === maxStats.units,

    streams: entry.streams,
    sales: entry.sales,
    airplay: entry.airplay,

    streamsPoints: Math.floor(entry.streams * 5),
    salesPoints: Math.floor(entry.sales * 3),
    airplayPoints: Math.floor(entry.airplay * 2),
    currentWeekPoints: entry.current_week_points,

    previousWeekRawPoints: prevRaw,
    previousWeekPoints: Math.floor(prevRaw * 0.3),
    twoWeeksAgoRawPoints: twoWeeksRaw,
    twoWeeksAgoPoints: Math.floor(twoWeeksRaw * 0.2),
  };

  let peakBgClass = "bg-blue-50/50";
  let streakColorClass = "text-gray-400";
  if (song.isNewPeak) {
    peakBgClass = "bg-[#ffe49a]";
    streakColorClass = "text-[#7e3d01]";
  } else if (song.isRePeak) {
    peakBgClass = "bg-[#cdecff]";
    streakColorClass = "text-[#024da0]";
  }

  return (
    <div className="flex flex-col border-b border-gray-100 group">
      {/* THE MAIN ROW (Clickable) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`grid grid-cols-[3rem_3rem_1fr_2rem_4rem_4rem_3rem_3rem_5rem_3rem_5rem_3rem_5rem_3rem_5rem] items-center h-14 cursor-pointer transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
      >
        {/* Rank */}
        <div className="font-black text-xl text-center text-gray-800">
          {song.rank}
        </div>

        {/* Change Indicator */}
        <div className="text-center font-bold text-xs">
          {song.status === "re" && (
            <span className="text-[#8e0be5] bg-purple-50 px-1 rounded">RE</span>
          )}
          {song.status === "new" && (
            <span className="text-[#05a7e5] bg-blue-50 px-1 rounded">NEW</span>
          )}
          {song.status === "stable" && (
            <span className="text-black text-xl leading-none">=</span>
          )}
          {song.status === "rise" && (
            <span className="text-green-600">+{song.change}</span>
          )}
          {song.status === "fall" && (
            <span className="text-red-500">-{song.change}</span>
          )}
        </div>

        {/* Song Info */}
        <div className="flex items-center gap-3 pl-2 overflow-hidden py-1">
          <Link
            href={`/library/album/${song.albumId}`}
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 bg-gray-200 shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow block"
          >
            {song.coverUrl && (
              <img
                src={song.coverUrl}
                className="w-full h-full object-cover"
                loading="lazy"
                alt="Cover"
              />
            )}
          </Link>
          <div className="truncate pr-4">
            {entry.disableSongLink ? (
              <div className="font-bold leading-tight truncate text-gray-900 block">
                {song.title}
              </div>
            ) : (
              <Link
                href={`/library/song/${entry.songs?.id}`}
                className="font-bold leading-tight truncate text-gray-900 hover:text-blue-600 transition-colors block"
                onClick={(e) => e.stopPropagation()}
              >
                {song.title}
              </Link>
            )}

            <Link
              href={
                entry.songs?.artists?.customHref ||
                `/library/artist/${song.artistId}`
              }
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline truncate font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {displaySubLabel}
            </Link>
          </div>
        </div>

        {/* Feed Indicator Column */}
        <div
          className="flex items-center justify-center h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* <FeedTooltip feed={song.feed} /> */}
        </div>

        {/* Points Section */}
        <div className="text-center font-bold text-gray-700">
          {formatNumber(song.points)}
        </div>
        <div className="flex justify-center">
          {song.pointsPct === "--" ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">
              --
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${song.pointsPct.includes("-") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
            >
              {song.pointsPct}%
            </span>
          )}
        </div>

        {/* Chart Stats */}
        <div
          className={`text-center h-full flex flex-col justify-center border-l border-white ${peakBgClass}`}
        >
          <div className="font-bold leading-none text-gray-700">
            {song.peak}
          </div>
          {song.peakStreak && (
            <div
              className={`text-[9px] ${streakColorClass} font-bold uppercase mt-0.5`}
            >
              {song.peakStreak}x
            </div>
          )}
        </div>
        <div className="text-center text-gray-400 font-medium text-xs">
          {song.woc}
        </div>

        {/* Sales (Yellow) */}
        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${song.isTopSales ? "bg-[#f8e285] font-bold" : "bg-[#fff0ad] font-medium"}`}
        >
          {formatNumber(song.salesUnits)}
        </div>
        <div className="text-center bg-[#fff0ad] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#fff0ad]">
          {song.salesPct}
        </div>

        {/* Streams (Green) */}
        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${song.isTopStreams ? "bg-[#bcf08e] font-bold" : "bg-[#d5f7bb] font-medium"}`}
        >
          {formatNumber(song.streamsUnits)}
        </div>
        <div className="text-center bg-[#d5f7bb] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#d5f7bb]">
          {song.streamsPct}
        </div>

        {/* Airplay (Blue) */}
        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-gray-700 ${song.isTopAirplay ? "bg-[#9adafe] font-bold" : "bg-[#b4e3ff] font-medium"}`}
        >
          {formatNumber(song.airplayUnits)}
        </div>
        <div className="text-center bg-[#b4e3ff] h-full flex items-center justify-center text-xs text-gray-400 border-l border-[#b4e3ff]">
          {song.airplayPct}
        </div>

        {/* Units (Purple) */}
        <div
          className={`text-center h-full flex items-center justify-center border-l border-white text-purple-900 ${song.isTopUnits ? "bg-[#dcace8] font-bold" : "bg-[#e7d6ff] font-bold"}`}
        >
          {formatNumber(song.units)}
        </div>
      </div>

      {/* THE DROPDOWN PANEL */}
      {isExpanded && (
        <div className="bg-white border-t border-gray-100 px-8 py-5 text-sm shadow-inner overflow-hidden cursor-default">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: Raw Scores */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Scores
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Streams:</span>{" "}
                <span className="font-mono">{formatNumber(song.streams)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Sales:</span>{" "}
                <span className="font-mono">{formatNumber(song.sales)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Airplay:</span>{" "}
                <span className="font-mono">{formatNumber(song.airplay)}</span>
              </div>
            </div>

            {/* Column 2: Component Points */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Points
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Streams:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">
                    {formatNumber(song.streams)} x 5 ={" "}
                  </span>
                  <span className="text-gray-800">
                    {formatNumber(song.streamsPoints)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>Sales:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">
                    {formatNumber(song.sales)} x 3 ={" "}
                  </span>
                  <span className="text-gray-800">
                    {formatNumber(song.salesPoints)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Airplay:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-xs">
                    {formatNumber(song.airplay)} x 2 ={" "}
                  </span>
                  <span className="text-gray-800">
                    {formatNumber(song.airplayPoints)}
                  </span>
                </span>
              </div>
            </div>

            {/* Column 3: Time Decay */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 text-xs uppercase mb-2 block border-b pb-1">
                Decay
              </span>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>This week:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(song.streamsPoints)} +{" "}
                    {formatNumber(song.salesPoints)} +{" "}
                    {formatNumber(song.airplayPoints)} =
                  </span>
                  <span className="text-gray-800 ml-1">
                    {formatNumber(song.currentWeekPoints)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-1">
                <span>One week ago:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(song.previousWeekRawPoints)} x 30% =
                  </span>
                  <span className="text-gray-800 ml-1">
                    {song.previousWeekPoints}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Two weeks ago:</span>
                <span className="font-mono whitespace-nowrap">
                  <span className="text-gray-400 text-[10px] sm:text-xs">
                    {formatNumber(song.twoWeeksAgoRawPoints)} x 20% =
                  </span>
                  <span className="text-gray-800 ml-1">
                    {song.twoWeeksAgoPoints}
                  </span>
                </span>
              </div>
            </div>

            {/* Column 4: Final Total */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col justify-center items-center">
              <span className="font-bold text-blue-800 text-xs uppercase mb-1">
                Total Points
              </span>
              <span className="text-4xl font-black text-blue-900 tracking-tighter leading-none mb-1">
                {formatNumber(song.points)}
              </span>
              <span className="text-[12px] text-blue-600/70 font-mono font-bold tracking-tight">
                {formatNumber(song.currentWeekPoints)} +{" "}
                {formatNumber(song.previousWeekPoints)} +{" "}
                {formatNumber(song.twoWeeksAgoPoints)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-gray-500" />
              Share & Export
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 h-[100px] flex items-center justify-center italic text-xs">
                News Feed placeholders go here
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center text-gray-400 h-[100px] flex items-center justify-center italic text-xs">
                Copy-pastable caption placeholder
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2.5 text-sm shadow"
                >
                  <Ticket className="w-5 h-5" />
                  View Chart Ticket
                </button>
                <Link
                  href={`/library/song/${entry.songs?.id}`}
                  className="bg-white text-gray-900 font-bold py-2.5 px-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 text-sm shadow-sm"
                >
                  <LineChart className="w-5 h-5 text-gray-500" />
                  View All-Time Stats
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 shadow-xl flex flex-col gap-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex justify-between items-end pr-8">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">
                Chart Ticket
              </h2>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Rendering..." : "Download High-Res PNG"}
              </button>
            </div>

            <div className="w-full flex justify-center bg-gray-50 rounded-xl p-4 overflow-x-auto border border-gray-200">
              <div
                ref={ticketRef}
                className="bg-[#f9fafb] p-8 flex flex-col gap-6 rounded-xl shrink-0 w-[800px]" // Fixed width ensures export is perfectly proportioned
              >
                <div className="flex justify-between items-center text-white/50 px-2">
                  <span className="font-bold tracking-widest text-gray-600 text-sm uppercase">
                    Personal Hot 100
                  </span>
                  <span className="font-bold text-xs text-gray-600">
                    Chart dated {week}
                  </span>
                </div>

                <ChartTicket song={song} />

                <div className="flex justify-between items-center text-gray-400 text-xs px-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3 h-3" />
                    {song.artistId}
                  </span>
                  <span className="tracking-widest text-gray-600">
                    {song.artist}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
