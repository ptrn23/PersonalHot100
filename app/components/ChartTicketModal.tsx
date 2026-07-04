"use client";

import { useState, useRef } from "react";
import { X, Download, Ticket } from "lucide-react";
import { toPng } from "html-to-image";
import ChartTicket from "./ChartTicket";
import { DisplayEntry } from "./ChartRow";
import { CHART_NAME } from "@/config/constants";

export default function ChartTicketModal({
  entry,
  week,
  onClose,
}: {
  entry: DisplayEntry;
  week: string;
  onClose: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

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
      link.download = `${entry.primaryText.replace(/\s+/g, "-")}-Hot100.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export ticket", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm transition-opacity"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl cursor-default flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-end justify-between pr-8">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Chart Ticket</h2>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Rendering..." : "Download"}
          </button>
        </div>

        <div className="flex w-full justify-center overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div
            ref={ticketRef}
            className="flex w-[800px] shrink-0 flex-col gap-6 rounded-xl bg-[#f9fafb] p-8"
          >
            <div className="flex items-center justify-between px-2 text-white/50">
              <span className="text-sm font-bold tracking-widest text-gray-600 uppercase">
                {CHART_NAME} Hot 100
              </span>
              <span className="text-xs font-bold text-gray-600">Chart dated {week}</span>
            </div>

            <ChartTicket entry={entry} />

            <div className="flex items-center justify-between px-2 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <Ticket className="h-3 w-3" />
                {entry.id.split("-")[0]}
              </span>
              <span className="tracking-widest text-gray-600 uppercase">
                {entry.secondaryText || "Artist Data"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
