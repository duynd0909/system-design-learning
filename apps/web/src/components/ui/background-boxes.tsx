'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const HOVER_COLORS = [
  'rgb(125 211 252)',  // sky-300
  'rgb(249 168 212)',  // pink-300
  'rgb(134 239 172)',  // green-300
  'rgb(253 224 71)',   // yellow-300
  'rgb(216 180 254)',  // purple-300
  'rgb(147 197 253)',  // blue-300
  'rgb(165 180 252)',  // indigo-300
  'rgb(196 181 253)',  // violet-300
];

function randomColor() {
  return HOVER_COLORS[Math.floor(Math.random() * HOVER_COLORS.length)];
}

// Reduced grid size vs. the reference (150×100) for footer usage.
// 24 rows × 20 cols = 480 elements — enough to fill the area without
// taxing the main thread on every hover.
const ROWS = 24;
const COLS = 20;

export const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        transform:
          'translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) translateZ(0)',
      }}
      className={cn(
        'absolute left-1/4 -top-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4',
        className,
      )}
      aria-hidden="true"
      {...rest}
    >
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} className="relative h-8 w-16 border-l border-[var(--text-primary)]/10">
          {Array.from({ length: COLS }, (_, j) => (
            <motion.div
              key={j}
              whileHover={
                prefersReduced
                  ? undefined
                  : { backgroundColor: randomColor(), transition: { duration: 0 } }
              }
              className="relative h-8 w-16 border-r border-t border-[var(--text-primary)]/10"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="pointer-events-none absolute -left-[22px] -top-[14px] h-6 w-10 stroke-[1px] text-[var(--text-primary)]/8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
