import Link from "next/link";
import { CHART_NAME } from "@/config/constants";

export default function LibraryUnderConstruction() {
  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center bg-gray-50 p-6 font-geist select-none">
      <div className="flex w-full max-w-xl flex-col items-center border-4 border-black bg-white p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="mb-6 bg-[#B30000] px-4 py-1.5 text-xs font-black tracking-[0.2em] text-white uppercase">
          Under Construction
        </div>
        
        <h1 className="mb-4 text-6xl leading-none font-black tracking-tighter text-black uppercase">
          Library
        </h1>
        
        <p className="mb-10 text-sm font-bold tracking-widest text-gray-500 uppercase">
          This page is being worked on.
        </p>
        
        <Link
          href="https://socasualcharts.vercel.app"
          className="border-2 border-black bg-black px-8 py-4 text-xs font-black tracking-widest text-white uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(179,0,0,1)] hover:bg-[#B30000]"
        >
          Back to {CHART_NAME}
        </Link>
        
      </div>
    </div>
  );
}