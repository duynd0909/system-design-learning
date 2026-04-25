import { cn } from '@/lib/utils';
import { Difficulty } from '@stackdify/shared-types';

type BadgeVariant = 'default' | 'easy' | 'medium' | 'hard' | 'xp' | 'level';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  xp: 'bg-[var(--accent-game)]/10 text-[var(--accent-game)]',
  level: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const variant: BadgeVariant =
    difficulty === Difficulty.EASY ? 'easy' : difficulty === Difficulty.MEDIUM ? 'medium' : 'hard';
  return <Badge variant={variant}>{difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}</Badge>;
}
