import Link from "next/link";
import { Database, Code2, LineChart } from "lucide-react";

import { CHART_NAME } from "@/config/constants";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] pt-12 pb-24 text-gray-900">
      <div className="mx-auto max-w-5xl px-10 md:px-0">
        {/* Header Grid */}
        <div className="mb-16 flex flex-col justify-between border-b-4 border-black pb-8 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block text-sm font-bold tracking-[0.3em] text-gray-400 uppercase">
              What is this?
            </span>
            <h1 className="text-6xl leading-none font-black tracking-tighter uppercase md:text-8xl">
              About
            </h1>
          </div>
          <div className="mt-6 text-right md:mt-0">
            <span className="block text-xl font-bold tracking-tight text-[#B30000]">
              {CHART_NAME} HOT 100
            </span>
            <span className="text-sm font-medium text-gray-500">v1.0.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="flex flex-col gap-8 md:col-span-7">
            <p className="text-2xl leading-relaxed font-medium tracking-tight text-gray-800">
              {CHART_NAME} Charts is an algorithmic music tracking system inspired by the Billboard
              Hot 100.
            </p>

            <p className="text-lg leading-relaxed text-gray-600">
              As an avid music listener and data enthusiast, I built {CHART_NAME} Charts to answer a
              simple question: "What would my personal Hot 100 look like?"
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              The project is a love letter to music discovery and data-driven insights, offering
              users a unique way to track their listening habits and uncover previous chapters of
              their musical journey. Maybe you want to see what you were listening to in your first
              year of college, or that time you were obsessed with a particular artist. Whether
              you're a casual listener or a chart-topping superfan, {CHART_NAME} Charts provides a
              dynamic and personalized music experience that evolves with you over time.
            </p>
          </div>

          {/* Right Column: Tech Stack */}
          <div className="md:col-span-5">
            <div className="bg-black p-8 text-white shadow-xl">
              <span className="mb-8 block border-b border-gray-800 pb-4 text-sm font-bold tracking-widest text-gray-400 uppercase">
                Core Stack
              </span>

              <ul className="flex flex-col gap-6">
                <li className="flex items-center gap-4">
                  <div className="shrink-0 rounded-lg bg-[#B30000] p-3">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="block text-lg font-bold">Next.js 15</span>
                    <span className="text-sm text-gray-400">App Router & Server Actions</span>
                  </div>
                </li>

                <li className="flex items-center gap-4">
                  <div className="shrink-0 rounded-lg bg-gray-800 p-3">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="block text-lg font-bold">Supabase</span>
                    <span className="text-sm text-gray-400">PostgreSQL & Auth</span>
                  </div>
                </li>

                <li className="flex items-center gap-4">
                  <div className="shrink-0 rounded-lg bg-gray-800 p-3">
                    <LineChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="block text-lg font-bold">Tailwind CSS</span>
                    <span className="text-sm text-gray-400">Utility-First Styling</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
