'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  starCount?: number;
  gradientColors?: [string, string];
  pulseDuration?: number;
  ariaLabel?: string;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className,
  children,
  starCount = 50,
  gradientColors = [
    'var(--aurora-color1)',
    'var(--aurora-color2)',
  ],
  pulseDuration = 10,
  ariaLabel = 'Animated aurora background',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [colorA, colorB] = gradientColors;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'relative flex w-full flex-col items-center justify-center overflow-hidden',
        'bg-[var(--bg-primary)] text-[var(--text-primary)]',
        className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Pulsing radial gradients — opacity adapts per theme via CSS var */}
        <div
          className="absolute inset-0 opacity-[var(--aurora-overlay-opacity)]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 20% 40%, ${colorA} 0%, transparent 70%),
              radial-gradient(ellipse 60% 80% at 80% 60%, ${colorB} 0%, transparent 70%)
            `,
            backgroundSize: '100% 100%',
            animation: shouldReduceMotion ? 'none' : `aurora-pulse ${pulseDuration}s ease-in-out infinite`,
          }}
        />

        {/*
          Blobs — multiply blend on light (tints white with color),
          screen blend on dark (adds light to dark bg).
          Colors are lighter in light mode, more saturated in dark.
        */}
        <motion.div
          className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full blur-3xl
                       bg-purple-300 opacity-30 dark:bg-purple-600 dark:opacity-40"
            animate={shouldReduceMotion ? {} : { x: [-50, 50, -50], y: [-20, 20, -20], scale: [1, 1.2, 1] }}
            transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full blur-3xl
                       bg-fuchsia-300 opacity-30 dark:bg-fuchsia-600 dark:opacity-40"
            animate={shouldReduceMotion ? {} : { x: [50, -50, 50], y: [20, -20, 20], scale: [1, 1.3, 1] }}
            transition={{ duration: 40, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-1/3 top-1/3 h-1/3 w-1/3 rounded-full blur-3xl
                       bg-indigo-300 opacity-20 dark:bg-indigo-700 dark:opacity-30"
            animate={shouldReduceMotion ? {} : { x: [20, -20, 20], y: [-30, 30, -30], rotate: [0, 360, 0] }}
            transition={{ duration: 50, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Stars — visible only in dark mode */}
        <div className="opacity-0 transition-opacity duration-500 dark:opacity-100">
          {!shouldReduceMotion &&
            Array.from({ length: starCount }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-0.5 w-0.5 rounded-full bg-white"
                initial={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  opacity: 0,
                }}
                animate={{ opacity: [0, Math.random() * 0.8, 0] }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AuroraBackground;
