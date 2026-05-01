'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface XpCounterProps {
  from?: number;
  to: number;
  duration?: number; // seconds
  className?: string;
  colorVar?: string; // CSS color value e.g. 'var(--slot-correct)'
}

export function XpCounter({ from = 0, to, duration = 1.2, className, colorVar }: XpCounterProps) {
  const prefersReduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReduced ? to : from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(to);
      return;
    }

    const startTime = performance.now();
    const range = to - from;

    function tick(now: number) {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + range * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, prefersReduced]);

  return (
    <span
      className={`tabular-nums ${className ?? ''}`.trim()}
      style={colorVar ? { color: colorVar } : undefined}
      aria-label={`${to} XP earned`}
    >
      {displayed}
    </span>
  );
}
