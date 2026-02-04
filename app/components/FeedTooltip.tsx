'use client';

import { useState, useEffect, useRef } from 'react';

export default function FeedTooltip({ feed }: { feed: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative flex items-center justify-center h-full w-full" ref={tooltipRef}>
      {/* Trigger (Button) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-3 w-3 items-center justify-center focus:outline-none"
        aria-label="Show chart feed"
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div className="absolute z-50 left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 cursor-auto text-left border border-gray-700">
          <div className="flex flex-col gap-2 select-text">
            {feed.map((line, i) => (
              <p key={i} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
          {/* Little Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}