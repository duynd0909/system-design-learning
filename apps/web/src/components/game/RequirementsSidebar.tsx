'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Check, CheckCircle2, Clock, Eye, History, Lock, Loader2, Network, XCircle } from 'lucide-react';
import type { ComponentType, Requirement, SubmissionHistoryItem } from '@stackdify/shared-types';
import { Difficulty } from '@stackdify/shared-types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { fadeIn } from '@/lib/animations';
import { useMySubmissions } from '@/lib/api';
import { ComponentPalette } from './ComponentPalette';

interface RequirementsSidebarProps {
  problem: { slug: string; title: string; difficulty: Difficulty; description: string };
  requirements: Requirement[];
  components: ComponentType[];
  placedSlugs: Set<string>;
  currentOrder: number;
  completedOrders: Set<number>;
  isLoading: boolean;
  token?: string | null;
  onSelectRequirement?: (order: number) => void;
  onComponentClick?: (componentSlug: string) => void;
  onViewSubmission?: (submissionId: string, requirementOrder: number) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface SubmissionRowProps {
  item: SubmissionHistoryItem;
  onView: () => void;
}

function SubmissionRow({ item, onView }: SubmissionRowProps) {
  const timeSecs = Math.round(item.timeTakenMs / 1000);
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--text-primary)]/5">
      {item.passed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--slot-correct)]" aria-hidden="true" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-[var(--slot-incorrect)]" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              item.passed ? 'text-[var(--slot-correct)]' : 'text-[var(--slot-incorrect)]',
            )}
          >
            {item.score}%
          </span>
          <span className="text-xs text-[var(--text-secondary)]">{formatDate(item.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatTime(timeSecs)}
        </div>
      </div>
      <button
        type="button"
        onClick={onView}
        aria-label="View submission graph"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function RequirementsSidebar({
  problem,
  requirements,
  components,
  placedSlugs,
  currentOrder,
  completedOrders,
  isLoading,
  token,
  onSelectRequirement,
  onComponentClick,
  onViewSubmission,
}: RequirementsSidebarProps) {
  const prefersReduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [subTab, setSubTab] = useState<'requirements' | 'components'>('requirements');

  const completedCount = completedOrders.size;
  const totalCount = requirements.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const { data: submissionsPage, isLoading: isSubmissionsLoading } = useMySubmissions(
    token ?? '',
    1,
    100,
  );

  const problemSubmissions = (submissionsPage?.data ?? [])
    .filter((item) => item.problem.slug === problem.slug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const submissionsByOrder = problemSubmissions.reduce<Record<number, SubmissionHistoryItem[]>>(
    (acc, item) => {
      const order = item.requirementOrder ?? 1;
      (acc[order] ??= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <aside
      aria-label="Problem sidebar"
      className="flex h-full w-full flex-col bg-[var(--bg-secondary)]"
    >
      {/* ── Top-level tabs ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Sidebar sections"
        className="flex shrink-0 border-b border-[var(--text-primary)]/10"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'description'}
          onClick={() => setActiveTab('description')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'description'
              ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          Description
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'submissions'}
          onClick={() => setActiveTab('submissions')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'submissions'
              ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          Submissions
        </button>
      </div>

      {/* ── Description tab ────────────────────────────────────────────── */}
      {activeTab === 'description' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Problem header */}
          <div className="shrink-0 border-b border-[var(--text-primary)]/10 p-4">
            <div className="mb-1 flex items-center gap-2">
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <h1 className="font-display text-lg font-bold leading-snug text-[var(--text-primary)]">
              {problem.title}
            </h1>
            <div
              className="mt-1.5 text-sm text-[var(--text-secondary)] [&_a]:text-[var(--accent-primary)] [&_em]:italic [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>

          {/* Requirements / Components sub-tabs */}
          <div className="shrink-0 border-b border-[var(--text-primary)]/10 px-3 pt-2">
            <div
              role="tablist"
              aria-label="Content section"
              className="grid grid-cols-2 rounded-lg bg-[var(--text-primary)]/5 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={subTab === 'requirements'}
                onClick={() => setSubTab('requirements')}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                  subTab === 'requirements'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                Requirements
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={subTab === 'components'}
                onClick={() => setSubTab('components')}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                  subTab === 'components'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                Components
              </button>
            </div>
          </div>

          {/* Sub-tab content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {subTab === 'requirements' ? (
              <>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  Requirements
                </h2>

                {isLoading ? (
                  <div className="flex items-center gap-2 px-1 py-4 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading...
                  </div>
                ) : (
                  <ol className="space-y-1.5">
                    {requirements.map((req) => {
                      const isCompleted = completedOrders.has(req.order);
                      const isActive = req.order === currentOrder;
                      const highestAccessible =
                        completedOrders.size > 0 ? Math.max(...completedOrders) + 1 : 1;
                      const isLocked = !isCompleted && req.order > highestAccessible;
                      const isClickable =
                        (isCompleted || req.order === highestAccessible) &&
                        !isActive &&
                        onSelectRequirement;

                      return (
                        <li key={req.id}>
                          <motion.button
                            type="button"
                            disabled={isLocked || isActive}
                            onClick={isClickable ? () => onSelectRequirement!(req.order) : undefined}
                            initial={prefersReduced ? undefined : fadeIn.initial}
                            animate={prefersReduced ? undefined : fadeIn.animate}
                            transition={{ delay: (req.order - 1) * 0.06 }}
                            className={cn(
                              'group w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-200',
                              isActive &&
                                'border border-[#00ffa3]/30 bg-[#00ffa3]/6 shadow-sm dark:shadow-[0_0_16px_rgba(0,255,163,0.04)]',
                              isCompleted && !isActive && 'cursor-pointer hover:bg-[var(--bg-primary)]/60',
                              isLocked && 'cursor-default opacity-40',
                              !isActive && !isCompleted && !isLocked && 'hover:bg-[var(--bg-primary)]/40',
                            )}
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={
                              isLocked
                                ? `Requirement ${req.order}: ${req.title} - locked`
                                : isCompleted
                                  ? `Requirement ${req.order}: ${req.title} - completed`
                                  : `Requirement ${req.order}: ${req.title} - active`
                            }
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={cn(
                                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold',
                                  isCompleted && 'bg-[#00ffa3] text-black',
                                  isActive && !isCompleted && 'bg-[#00ffa3] text-black',
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
                                    'text-base font-semibold leading-tight',
                                    isActive
                                      ? 'text-[var(--text-primary)]'
                                      : 'text-[var(--text-primary)]/80',
                                  )}
                                >
                                  {req.title}
                                </div>
                                <div className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                                  {req.description}
                                </div>
                              </div>

                              {isActive && (
                                <span
                                  className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#00ffa3]"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          </motion.button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </>
            ) : (
              <div>
                <div className="mb-3 flex items-center gap-2 px-1">
                  <Network className="h-3.5 w-3.5 text-[#00ffa3]" aria-hidden="true" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                    Components
                  </h2>
                </div>
                <p className="mb-3 px-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Choose an empty slot, then add the matching infrastructure component.
                </p>
                <ComponentPalette
                  components={components}
                  placedSlugs={placedSlugs}
                  variant="panel"
                  onComponentClick={onComponentClick}
                />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="shrink-0 border-t border-[var(--text-primary)]/10 p-4">
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
        </div>
      ) : (
        /* ── Submissions tab ─────────────────────────────────────────── */
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!token ? (
            <p className="px-1 pt-2 text-sm text-[var(--text-secondary)]">
              <Link
                href="/login"
                className="font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Sign in
              </Link>{' '}
              to see your submission history.
            </p>
          ) : isSubmissionsLoading ? (
            <div className="space-y-2 pt-1">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : problemSubmissions.length === 0 ? (
            <p className="px-1 pt-2 text-sm text-[var(--text-secondary)]">
              No submissions yet for this problem.
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {Object.keys(submissionsByOrder)
                .map(Number)
                .sort((a, b) => a - b)
                .map((order) => (
                  <div key={order}>
                    <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                      Requirement {order}
                    </div>
                    <div className="space-y-0.5">
                      {submissionsByOrder[order].map((item) => (
                        <SubmissionRow
                          key={item.id}
                          item={item}
                          onView={() => onViewSubmission?.(item.id, item.requirementOrder ?? 1)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
