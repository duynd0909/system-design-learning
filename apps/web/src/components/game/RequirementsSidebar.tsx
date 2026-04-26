'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check, Lock, Loader2 } from 'lucide-react';
import type { Requirement } from '@stackdify/shared-types';
import { Difficulty } from '@stackdify/shared-types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { fadeIn } from '@/lib/animations';

interface RequirementsSidebarProps {
  problem: { title: string; difficulty: Difficulty; description: string };
  requirements: Requirement[];
  currentOrder: number;
  completedOrders: Set<number>;
  isLoading: boolean;
  onSelectRequirement?: (order: number) => void;
}

export function RequirementsSidebar({
  problem,
  requirements,
  currentOrder,
  completedOrders,
  isLoading,
  onSelectRequirement,
}: RequirementsSidebarProps) {
  const prefersReduced = useReducedMotion();
  const completedCount = completedOrders.size;
  const totalCount = requirements.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <aside
      aria-label="Requirements"
      className="flex w-[300px] shrink-0 flex-col border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)]"
    >
      {/* Problem header */}
      <div className="border-b border-[var(--text-primary)]/10 p-4">
        <div className="mb-1 flex items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <h1 className="font-display text-base font-bold leading-snug text-[var(--text-primary)]">
          {problem.title}
        </h1>
        <p className="mt-1.5 line-clamp-3 text-xs text-[var(--text-secondary)]">
          {problem.description}
        </p>
      </div>

      {/* Requirements list */}
      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Requirements
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 px-1 py-4 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : (
          <ol className="space-y-1.5">
            {requirements.map((req) => {
              const isCompleted = completedOrders.has(req.order);
              const isActive = req.order === currentOrder;
              const isLocked = !isCompleted && req.order > currentOrder;
              const isClickable = isCompleted && onSelectRequirement;

              return (
                <li key={req.id}>
                  <motion.button
                    type="button"
                    disabled={isLocked || isActive}
                    onClick={isClickable ? () => onSelectRequirement(req.order) : undefined}
                    initial={prefersReduced ? undefined : fadeIn.initial}
                    animate={prefersReduced ? undefined : fadeIn.animate}
                    transition={{ delay: (req.order - 1) * 0.06 }}
                    className={cn(
                      'group w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                      isActive && 'border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/8 shadow-sm',
                      isCompleted && !isActive && 'cursor-pointer hover:bg-[var(--bg-primary)]/60',
                      isLocked && 'cursor-default opacity-40',
                      !isActive && !isCompleted && !isLocked && 'hover:bg-[var(--bg-primary)]/40',
                    )}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={
                      isLocked
                        ? `Requirement ${req.order}: ${req.title} — locked`
                        : isCompleted
                          ? `Requirement ${req.order}: ${req.title} — completed`
                          : `Requirement ${req.order}: ${req.title} — active`
                    }
                  >
                    <div className="flex items-start gap-2.5">
                      {/* State icon */}
                      <span
                        className={cn(
                          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold',
                          isCompleted && 'bg-[var(--slot-correct)] text-white',
                          isActive && !isCompleted && 'bg-[var(--accent-primary)] text-white',
                          isLocked && 'bg-[var(--text-primary)]/15 text-[var(--text-secondary)]',
                        )}
                        aria-hidden="true"
                      >
                        {isCompleted ? (
                          <Check className="h-3 w-3" />
                        ) : isLocked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          req.order
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'text-sm font-semibold leading-tight',
                            isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]/80',
                          )}
                        >
                          {req.title}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-2">
                          {req.description}
                        </div>
                      </div>

                      {/* Active pulse dot */}
                      {isActive && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)] animate-pulse" aria-hidden="true" />
                      )}
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Progress bar */}
      <div className="border-t border-[var(--text-primary)]/10 p-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Progress</span>
          <span className="font-semibold tabular-nums">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--text-primary)]/10">
          <motion.div
            className="h-full rounded-full bg-[var(--slot-correct)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </aside>
  );
}
