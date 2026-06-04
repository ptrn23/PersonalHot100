"use client";

const formatNumber = (num: number) => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ChartTicket({ song }: { song: any }) {
  return (
    <div
      className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden flex bg-gray-900 text-white shadow-2xl"
      style={{
        maskImage: "radial-gradient(circle at -2px 12px, transparent 6px, black 7px)",
        maskSize: "100% 24px",
        maskRepeat: "repeat-y",
        WebkitMaskImage: "radial-gradient(circle at -2px 12px, transparent 6px, black 7px)",
        WebkitMaskSize: "100% 24px",
        WebkitMaskRepeat: "repeat-y",
      }}
    >
      <div className="relative w-1/2 h-full">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />
        
        <div className="absolute top-6 left-8">
          <span className="text-6xl font-black italic tracking-tighter leading-none drop-shadow-md">
            #{song.rank}
          </span>
        </div>

        <div className="absolute bottom-6 left-8 flex flex-col pr-6">
          <span className="text-2xl font-bold leading-6 mb-1 line-clamp-2 drop-shadow-md">
            {song.title}
          </span>
          <span className="text-base text-gray-300 font-medium leading-none line-clamp-1 drop-shadow-md">
            {song.artist}
          </span>
        </div>
      </div>

      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -ml-[1px] border-l-2 border-dashed border-white/70 z-10" />

      <div className="relative w-1/2 h-full overflow-hidden flex flex-col justify-between p-8">
        <div className="absolute inset-0 z-0">
          {song.coverUrl && (
            <img
              src={song.coverUrl}
              alt=""
              className="w-full h-full object-cover blur-2xl opacity-75 scale-125"
            />
          )}
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">
            Personal Hot 100
          </p>
          <p className="text-sm font-medium leading-4">
            Charting for <span className="font-bold text-white">{song.woc} weeks</span>
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center -mt-4">
          <span className="text-6xl font-black tracking-tighter">
            {formatNumber(song.points)}
          </span>
          <span className="text-lg font-bold text-white/50 tracking-widest uppercase">
            POINTS
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[#f8e285] text-[10px] font-bold uppercase tracking-widest mb-0.5">Sales</div>
            <div className="text-lg font-bold leading-none">{formatNumber(song.salesUnits)}</div>
          </div>
          <div>
            <div className="text-[#bcf08e] text-[10px] font-bold uppercase tracking-widest mb-0.5">Streams</div>
            <div className="text-lg font-bold leading-none">{formatNumber(song.streamsUnits)}</div>
          </div>
          <div>
            <div className="text-[#9adafe] text-[10px] font-bold uppercase tracking-widest mb-0.5">Radio</div>
            <div className="text-lg font-bold leading-none">{formatNumber(song.airplayUnits)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}