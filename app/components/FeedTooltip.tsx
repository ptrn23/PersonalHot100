'use client';

import { useState, useEffect, useRef } from 'react';

export default function FeedTooltip({ feed }: { feed: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
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
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative flex items-center justify-center h-full w-full" ref={containerRef}>
      <button 
        onClick={handleToggle}
        className="relative flex h-3 w-3 items-center justify-center focus:outline-none"
        aria-label="Show chart feed"
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
      </button>

      {isOpen && (
        <div 
          className={`absolute z-50 left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 cursor-auto text-left border border-gray-700
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          <div className="flex flex-col gap-2 select-text max-h-60 overflow-y-auto">
            {feed.map((line, i) => (
              <p key={i} className="leading-relaxed border-b border-gray-800 last:border-0 pb-1 last:pb-0">
                {line}
              </p>
            ))}
          </div>
          
          {/* Dynamic Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent
            ${position === 'top' ? 'top-full border-t-gray-900' : 'bottom-full border-b-gray-900'}
          `}></div>
        </div>
      )}
    </div>
  );
}