"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareArtistButton({ artistId }: { artistId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `https://socasualcharts.vercel.app/library/artist/${artistId}`;
    
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
      className="group flex items-center gap-1.5 border-2 border-white bg-black px-3 py-1.5 font-mono text-xs font-bold text-white uppercase shadow-sm transition-colors hover:bg-white hover:text-black active:bg-gray-200"
    >
      {copied ? (
        <Check size={14} className="text-[#1DB954]" />
      ) : (
        <Share2 size={14} className="transition-transform group-hover:scale-110" />
      )}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}