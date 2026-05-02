'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon, type IconProps } from '@/components/ui/floating-icons-hero-section';

interface MinimalModernHeroProps {
  logo: React.ReactNode;
  badge?: string;
  title: string;
  subtitle?: string;
  description: string;
  primaryButton?: {
    label: string;
    onClick: () => void;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
  };
  stats?: Array<{
    value: string;
    label: string;
  }>;
  icons?: IconProps[];
  accentColor?: string;
  className?: string;
}

export default function MinimalModernHero({
  logo,
  badge,
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  stats = [],
  icons = [],
  accentColor = '#00ffa3',
  className = '',
}: MinimalModernHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  return (
    <section
      className={`relative h-screen w-full overflow-hidden bg-background ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Subtle Grid */}
      <div
        className="absolute inset-0 [--grid:rgba(0,0,0,0.03)] dark:[--grid:rgba(255,255,255,0.04)]"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Floating Icons layer */}
      {!shouldReduceMotion && icons.length > 0 && (
        <div className="absolute inset-0 w-full h-full hidden md:block">
          {icons.map((iconData, index) => (
            <Icon
              key={iconData.id}
              mouseX={mouseX}
              mouseY={mouseY}
              iconData={iconData}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Accent Line Top */}
      <motion.div
        className="absolute top-0 left-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        initial={{ width: '0%' }}
        animate={{ width: '50%' }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, ease: 'easeOut' }}
      />

      {/* Floating Accent Circle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '20%',
          right: '10%',
          width: '400px',
          height: '400px',
          border: `2px solid ${accentColor}20`,
        }}
        animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Small Accent Dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: '30%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: accentColor,
          opacity: 0.15,
        }}
        animate={shouldReduceMotion ? {} : { y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center px-6 py-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Logo */}
          {/* <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
            className="mb-16"
          >
            {logo}
          </motion.div> */}

          <div className="max-w-4xl">
            {/* Badge */}
            {badge && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }
                }
                className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
                style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ background: accentColor }}
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {badge}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 }
              }
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4 text-foreground"
              style={{ letterSpacing: '-0.04em' }}
            >
              {title.split(' ').map((word, index) => (
                <span
                  key={index}
                  style={
                    index === Math.floor(title.split(' ').length / 2)
                      ? { color: accentColor }
                      : undefined
                  }
                >
                  {word}{' '}
                </span>
              ))}
            </motion.h1>

            {/* Subtitle */}
            {subtitle && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.5 }
                }
                className="text-lg md:text-xl font-semibold mb-4 text-muted-foreground"
              >
                {subtitle}
              </motion.h2>
            )}

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.7 }
              }
              className="text-base md:text-lg mb-8 text-muted-foreground"
              style={{ lineHeight: '1.6', maxWidth: '700px' }}
            >
              {description}
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.9 }
              }
              className="flex flex-col sm:flex-row items-start gap-3 mb-10"
            >
              {primaryButton && (
                <motion.button
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : { scale: 1.05, boxShadow: `0 20px 50px ${accentColor}40` }
                  }
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  onClick={primaryButton.onClick}
                  className="px-8 py-4 rounded-2xl font-bold text-base cursor-pointer"
                  style={{ background: accentColor, color: '#000000' }}
                >
                  {primaryButton.label}
                </motion.button>
              )}

              {secondaryButton && (
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  onClick={secondaryButton.onClick}
                  className="px-8 py-4 rounded-2xl font-bold text-base text-foreground cursor-pointer transition-colors hover:bg-secondary"
                  style={{ background: 'transparent', border: '2px solid var(--border)' }}
                >
                  {secondaryButton.label}
                </motion.button>
              )}
            </motion.div>

            {/* Stats */}
            {stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 1.1 }
                }
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={shouldReduceMotion ? {} : { y: -5 }}
                    className="relative"
                  >
                    <div
                      className="absolute top-0 left-0 w-8 h-1"
                      style={{ background: accentColor }}
                    />
                    <div className="pt-4">
                      <div className="text-3xl md:text-4xl font-black mb-1 text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative rotating square */}
      <motion.div
        className="absolute"
        style={{
          bottom: '10%',
          right: '5%',
          width: '200px',
          height: '200px',
          border: `1px solid ${accentColor}30`,
          transform: 'rotate(45deg)',
        }}
        animate={shouldReduceMotion ? {} : { rotate: [45, 135, 45] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* Bottom Accent Line */}
      <motion.div
        className="absolute bottom-0 right-0 h-1"
        style={{ background: `linear-gradient(270deg, ${accentColor}, transparent)` }}
        initial={{ width: '0%' }}
        animate={{ width: '40%' }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 1.5, delay: 0.5, ease: 'easeOut' }
        }
      />
    </section>
  );
}
