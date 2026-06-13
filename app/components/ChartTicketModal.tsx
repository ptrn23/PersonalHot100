"use client";

import { useState, useRef } from "react";
import { X, Download, Ticket } from "lucide-react";
import { toPng } from "html-to-image";
import ChartTicket from "./ChartTicket";
import { DisplayEntry } from "./ChartRow";

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer" 
      />
      <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 shadow-xl flex flex-col gap-6 cursor-default">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-between items-end pr-8">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Chart Ticket</h2>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Rendering..." : "Download"}
          </button>
        </div>

        <div className="w-full flex justify-center bg-gray-50 rounded-xl p-4 overflow-x-auto border border-gray-200">
          <div ref={ticketRef} className="bg-[#f9fafb] p-8 flex flex-col gap-6 rounded-xl shrink-0 w-[800px]">
            <div className="flex justify-between items-center text-white/50 px-2">
              <span className="font-bold tracking-widest text-gray-600 text-sm uppercase">Personal Hot 100</span>
              <span className="font-bold text-xs text-gray-600">Chart dated {week}</span>
            </div>

            <ChartTicket entry={entry} />

            <div className="flex justify-between items-center text-gray-400 text-xs px-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Ticket className="w-3 h-3" />
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