"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareSongButton({ songId }: { songId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `https://socasualcharts.vercel.app/library/song/${songId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="group flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-gray-500 uppercase shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
    >
      {copied ? (
        <Check size={12} className="text-[#1DB954]" />
      ) : (
        <Share2 size={12} className="transition-transform group-hover:scale-110" />
      )}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}