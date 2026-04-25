import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Difficulty } from '@stackdify/shared-types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return String(xp);
}

export function xpForNextLevel(level: number): number {
  return level * 100 * level;
}

export function difficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return 'text-emerald-500';
    case Difficulty.MEDIUM:
      return 'text-amber-500';
    case Difficulty.HARD:
      return 'text-red-500';
  }
}

export function difficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return 'Easy';
    case Difficulty.MEDIUM:
      return 'Medium';
    case Difficulty.HARD:
      return 'Hard';
  }
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
}
