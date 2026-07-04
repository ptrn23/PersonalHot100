"use client";

import { useState, useEffect, useRef } from "react";

export default function FeedTooltip({ feed }: { feed: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const SPACE_NEEDED = 200;

      if (rect.top < SPACE_NEEDED) {
        setPosition("bottom");
      } else {
        setPosition("top");
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative flex h-3 w-3 items-center justify-center focus:outline-none"
        aria-label="Show chart feed"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
      </button>

      {isOpen && (
        <div
          className={`absolute left-1/2 z-50 w-64 -translate-x-1/2 cursor-auto rounded-lg border border-gray-700 bg-gray-900 p-3 text-left text-xs text-white shadow-xl ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} `}
        >
          <div className="flex max-h-60 flex-col gap-2 overflow-y-auto select-text">
            {feed.map((line, i) => (
              <p
                key={i}
                className="border-b border-gray-800 pb-1 leading-relaxed last:border-0 last:pb-0"
              >
                {line}
              </p>
            ))}
          </div>

          {/* Dynamic Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${position === "top" ? "top-full border-t-gray-900" : "bottom-full border-b-gray-900"} `}
          ></div>
        </div>
      )}
    </div>
  );
}
