"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const Tooltip = ({ content, children, delay = 0.3, className = "" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setIsVisible(true);
      }
    }, delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: "fixed",
              left: coords.x,
              top: coords.y,
              transform: "translateX(-50%) translateY(-100%)",
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                       border border-slate-200 dark:border-slate-800
                       text-slate-800 dark:text-slate-100 
                       shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                       max-w-xs break-words"
          >
            {content}
            {/* Arrow */}
            <div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 
                         bg-white/90 dark:bg-slate-900/90 
                         border-b border-r border-slate-200 dark:border-slate-800 
                         rotate-45" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
