import Link from "next/link";
import { Database, Code2, LineChart } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-gray-900 pb-24 pt-12">
      <div className="max-w-5xl mx-auto px-10 md:px-0">
        
        {/* Header Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-8 mb-16">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-[0.3em] text-sm mb-2 block">
              What is this?
            </span>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
              About
            </h1>
          </div>
          <div className="text-right mt-6 md:mt-0">
            <span className="text-[#B30000] font-bold text-xl tracking-tight block">
              PERSONAL HOT 100
            </span>
            <span className="text-gray-500 font-medium text-sm">
              v1.0.0
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-7 flex flex-col gap-8">
            <p className="text-2xl font-medium leading-relaxed tracking-tight text-gray-800">
              Personal Charts is an algorithmic music tracking system inspired by the Billboard Hot 100.
            </p>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              As an avid music listener and data enthusiast, I built Personal Charts to answer a simple question: "What would my personal Hot 100 look like?"
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              The project is a love letter to music discovery and data-driven insights, offering users a unique way to track their listening habits and uncover previous chapters of their musical journey. Maybe you want to see what you were listening to in your first year of college, or that time you were obsessed with a particular artist. Whether you're a casual listener or a chart-topping superfan, Personal Charts provides a dynamic and personalized music experience that evolves with you over time.
            </p>
          </div>

          {/* Right Column: Tech Stack */}
          <div className="md:col-span-5">
            <div className="bg-black text-white p-8 shadow-xl">
              <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-800 pb-4">
                Core Stack
              </span>
              
              <ul className="flex flex-col gap-6">
                <li className="flex items-center gap-4">
                  <div className="bg-[#B30000] p-3 rounded-lg shrink-0">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-lg">Next.js 15</span>
                    <span className="text-gray-400 text-sm">App Router & Server Actions</span>
                  </div>
                </li>

                <li className="flex items-center gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-lg">Supabase</span>
                    <span className="text-gray-400 text-sm">PostgreSQL & Auth</span>
                  </div>
                </li>

                <li className="flex items-center gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg shrink-0">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-lg">Tailwind CSS</span>
                    <span className="text-gray-400 text-sm">Utility-First Styling</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-8 border-t border-gray-200 mt-4">
              <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                Engineered By
              </span>
              <p className="text-3xl font-black uppercase tracking-tighter">
                ptrn23
              </p>
              <p className="text-gray-500 font-medium mt-1">
                Computer Science • UI/UX Architecture
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}