'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Check, CheckCircle2, Clock, Eye, History, Lock, Loader2, Network, Search, XCircle } from 'lucide-react';
import type { ComponentType, Requirement, SubmissionHistoryItem } from '@stackdify/shared-types';
import { Difficulty } from '@stackdify/shared-types';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { fadeIn } from '@/lib/animations';
import { useMySubmissions } from '@/lib/api';
import { ComponentPalette } from './ComponentPalette';
import { categoryForComponent, getCategoryStyle } from './graph-config';

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
  const [quickSearch, setQuickSearch] = useState('');

  const filteredQuickComponents = components.filter((c) => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return true;
    return c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const completedCount = completedOrders.size;
  const totalCount = requirements.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const { data: submissionsPage, isLoading: isSubmissionsLoading, isError: isSubmissionsError } = useMySubmissions(
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
      className="flex h-full w-full flex-col border-r border-[var(--text-primary)]/10 bg-[var(--bg-secondary)]"
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
            'flex-1 cursor-pointer px-4 py-2.5 text-center text-xs font-semibold transition-colors border-b-2 -mb-px',
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
            'flex-1 flex cursor-pointer items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px',
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
          <div className="shrink-0 border-b border-[var(--text-primary)]/10 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <DifficultyBadge difficulty={problem.difficulty} />
              <span className="text-[11px] text-[var(--text-secondary)]">System Design</span>
            </div>
            <h1 className="font-display text-[19px] font-bold leading-snug text-[var(--text-primary)]">
              {problem.title}
            </h1>
            <div
              className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)] [&_a]:text-[var(--accent-primary)] [&_em]:italic [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>

          {/* Requirements / Components sub-tabs */}
          <div className="shrink-0 flex gap-0.5 px-4 pt-3">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'requirements'}
              onClick={() => setSubTab('requirements')}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors',
                subTab === 'requirements'
                  ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
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
                'cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors',
                subTab === 'components'
                  ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              Components
            </button>
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
                              'group w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-150',
                              isActive &&
                                'bg-[var(--accent-primary)]/8',
                              isCompleted && !isActive && 'cursor-pointer hover:bg-[var(--text-primary)]/5',
                              isLocked && 'cursor-default opacity-40',
                              !isActive && !isCompleted && !isLocked && 'cursor-pointer hover:bg-[var(--text-primary)]/5',
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
                                  'mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                  isCompleted && 'bg-[var(--slot-correct)] text-black',
                                  isActive && !isCompleted && 'bg-[var(--accent-primary)] text-black',
                                  isLocked && 'bg-[var(--text-primary)]/15 text-[var(--text-secondary)]',
                                  !isCompleted && !isActive && !isLocked && 'bg-[var(--bg-primary)] text-[var(--text-secondary)]',
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
                                    'text-[13px] font-semibold leading-tight',
                                    isActive
                                      ? 'text-[var(--text-primary)]'
                                      : 'text-[var(--text-primary)]/80',
                                  )}
                                >
                                  {req.title}
                                </div>
                                <div className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
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
          <div className="shrink-0 border-t border-[var(--text-primary)]/10 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <span className="font-semibold uppercase tracking-wider">Progress</span>
              <span className="tabular-nums">
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--text-primary)]/10">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-primary)]"
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
          ) : isSubmissionsError ? (
            <p className="px-1 pt-2 text-sm text-[var(--slot-incorrect)]">
              Could not load submissions.
            </p>
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

      {/* ── Quick Components (hidden when Components sub-tab is active) ── */}
      {!(activeTab === 'description' && subTab === 'components') && (
      <div className="shrink-0 border-t border-[var(--text-primary)]/10 px-4 py-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Quick Components
        </div>
        <label className="relative mb-2 block">
          <span className="sr-only">Search components</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
          <input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 w-full rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--accent-primary)]/50"
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {filteredQuickComponents.slice(0, 8).map((comp) => {
            const catStyle = getCategoryStyle(categoryForComponent(comp));
            const isPlaced = placedSlugs.has(comp.slug);
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => onComponentClick?.(comp.slug)}
                disabled={isPlaced}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                  'hover:border-[var(--text-primary)]/15 hover:bg-[var(--bg-primary)]',
                  'disabled:cursor-default disabled:opacity-40',
                )}
                title={comp.description}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: catStyle.accent }} />
                <span className="truncate">{comp.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}
    </aside>
  );
}
