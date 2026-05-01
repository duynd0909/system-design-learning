'use client';

import { motion, useReducedMotion } from 'motion/react';

interface StreakBadgeProps {
  streak: number;
  animate?: boolean;
  className?: string;
}

export function StreakBadge({ streak, animate = false, className }: StreakBadgeProps) {
  const prefersReduced = useReducedMotion();

  if (streak < 1) return null;

  const content = (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${className ?? ''}`.trim()}
      style={{ color: 'var(--accent-game)' }}
    >
      🔥 <span className="tabular-nums">{streak}</span>
    </span>
  );

  if (animate && !prefersReduced) {
    return (
      <motion.span
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="inline-flex"
      >
        {content}
      </motion.span>
    );
  }

  return content;
}
