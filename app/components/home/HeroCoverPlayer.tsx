"use client";

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
  previewUrl: spotifyTrackId,
  movement,
}: HeroCoverPlayerProps) {
  
  return (
    <div className="border-2 border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
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
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Massive #1 Badge */}
        <div className="absolute top-2 left-2 flex h-14 w-14 items-center justify-center border-2 border-black bg-black/90 backdrop-blur font-black text-3xl text-white shadow-md z-10">
          #1
        </div>

        {/* Bottom Text Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pb-24 flex flex-col text-white z-10 pointer-events-none">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#B30000]">
            Official Certification Pacesetter
          </span>
          <span className="text-xl font-black truncate">{title}</span>
          <span className="text-sm font-bold text-gray-300 truncate uppercase">{artist}</span>
        </div>

        {/* SPOTIFY EMBED INJECTED AT BOTTOM */}
        {spotifyTrackId ? (
          <div className="absolute bottom-0 left-0 w-full z-20 shadow-[0px_-5px_15px_rgba(0,0,0,0.5)]">
            <iframe
              title="Spotify Track Preview"
              src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0&autoplay=1`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-none bg-black block"
            />
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 z-20 flex items-center justify-center bg-black/80 px-3 py-1.5 border border-white/20 text-[10px] font-mono text-white uppercase font-bold">
            Preview Unavailable
          </div>
        )}
      </div>
    </div>
  );
}