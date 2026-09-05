"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface HeroCoverPlayerProps {
  coverUrl: string;
  title: string;
  artist: string;
  previewUrl?: string | null;
  movement: string;
}

export default function HeroCoverPlayer({
  coverUrl,
  title,
  artist,
  previewUrl,
  movement,
}: HeroCoverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = () => {
    if (!audioRef.current || !previewUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio playback interrupted or blocked:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className="border-2 border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
      {/* Hidden HTML5 Audio Element */}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          preload="none"
        />
      )}

      {/* Card Header Tag */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center bg-[#B30000] text-white font-mono text-xs font-black">
            #
          </span>
          <span className="font-mono text-xs font-black tracking-widest uppercase">
            Current No. 1 Single
          </span>
        </div>
        <span className="bg-zinc-100 border border-black px-2 py-0.5 font-mono text-[10px] font-black tracking-wider uppercase text-zinc-800">
          {movement}
        </span>
      </div>

      {/* Artwork Container */}
      <div className="relative aspect-square w-full border-2 border-black bg-zinc-100 overflow-hidden shadow-inner mb-4 group">
        <img
          src={coverUrl}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isPlaying ? "scale-105" : "grayscale-25"
          }`}
        />

        {/* Massive #1 Badge */}
        <div className="absolute top-2 left-2 flex h-14 w-14 items-center justify-center border-2 border-black bg-black/90 backdrop-blur font-black text-3xl text-white shadow-md z-10">
          #1
        </div>

        {/* Live Audio Status Indicator */}
        {isPlaying && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/90 border border-black px-2.5 py-1 text-white font-mono text-[10px] font-black uppercase shadow">
            <Volume2 size={13} className="text-[#B30000] animate-pulse" />
            <span>PLAYING 30S PREVIEW</span>
          </div>
        )}

        {/* Center Play/Pause Button */}
        {previewUrl ? (
          <button
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause Preview" : "Play Preview"}
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-white/95 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-110 hover:bg-[#B30000] hover:text-white active:scale-95 z-20"
          >
            {isPlaying ? (
              <Pause size={26} fill="currentColor" />
            ) : (
              <Play size={26} fill="currentColor" className="ml-1" />
            )}
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-[11px] font-mono text-white uppercase font-bold">
            Preview Unavailable
          </div>
        )}

        {/* Bottom Text Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col text-white z-10">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#B30000]">
            Official Certification Pacesetter
          </span>
          <span className="text-xl font-black truncate">{title}</span>
          <span className="text-sm font-bold text-gray-300 truncate uppercase">{artist}</span>
        </div>
      </div>
    </div>
  );
}