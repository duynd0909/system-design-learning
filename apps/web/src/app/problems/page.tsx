'use client';

import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, LayoutGrid, List, Search } from 'lucide-react';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Fuse from 'fuse.js';
import { Difficulty } from '@stackdify/shared-types';
import type { ProblemSummary } from '@stackdify/shared-types';
import { useInfiniteProblems, useProblemCategories } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

const DIFFICULTIES = [
  { label: 'All', value: '' },
  { label: 'Easy', value: Difficulty.EASY },
  { label: 'Medium', value: Difficulty.MEDIUM },
  { label: 'Hard', value: Difficulty.HARD },
];

// ─── Requirement progress bar ─────────────────────────────────────────────────

function RequirementProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < completed
                ? 'bg-[var(--slot-correct)]'
                : 'bg-[var(--text-primary)]/15'
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-secondary)]">
        {completed}/{total}
      </span>
    </div>
  );
}

// ─── Card view item ───────────────────────────────────────────────────────────

function ProblemCard({
  problem,
  isAuthenticated,
}: {
  problem: ProblemSummary;
  isAuthenticated: boolean;
}) {
  const completedCount = problem.completedRequirementOrders?.length ?? 0;
  return (
    <Link href={`/problems/${problem.slug}`} className="group block">
      <Card
        hover
        className="flex h-full flex-col transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(79,70,229,0.15)]"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <div className="flex items-center gap-2">
            {isAuthenticated && problem.isSolved ? (
              <Badge variant="level" className="gap-1">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Solved
              </Badge>
            ) : null}
            <span className="text-xs text-[var(--text-secondary)]">
              {problem.nodeCount} nodes
            </span>
          </div>
        </div>

        <CardTitle className="mb-2">{problem.title}</CardTitle>
        <CardDescription className="line-clamp-2 flex-1">
          <span dangerouslySetInnerHTML={{ __html: problem.description }}></span>
        </CardDescription>

        {isAuthenticated && problem.requirementCount > 0 && (
          <div className="mt-3">
            <RequirementProgress
              completed={completedCount}
              total={problem.requirementCount}
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            {problem.category}
          </span>
          <span className="text-xs font-medium text-[var(--accent-primary)] transition-all group-hover:translate-x-0.5">
            Practice →
          </span>
        </div>
      </Card>
    </Link>
  );
}

// ─── List view item ───────────────────────────────────────────────────────────

function ProblemListRow({
  problem,
  isAuthenticated,
}: {
  problem: ProblemSummary;
  isAuthenticated: boolean;
}) {
  const completedCount = problem.completedRequirementOrders?.length ?? 0;
  return (
    <Link href={`/problems/${problem.slug}`} className="group block">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--text-primary)]/8 bg-[var(--bg-secondary)] px-4 py-3.5 transition-all duration-200 hover:border-[var(--accent-primary)]/30 hover:shadow-[0_4px_24px_rgba(79,70,229,0.1)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-[var(--text-primary)]">
              {problem.title}
            </span>
            {isAuthenticated && problem.isSolved && (
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0 text-[var(--slot-correct)]"
                aria-label="Solved"
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            <span dangerouslySetInnerHTML={{ __html: problem.description }}></span>
          </p>
        </div>

        <div className="flex w-[76px] shrink-0 justify-start">
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <span className="hidden shrink-0 text-xs text-[var(--text-secondary)] sm:block">
          {problem.category}
        </span>

        {isAuthenticated && problem.requirementCount > 0 ? (
          <div className="hidden w-32 shrink-0 lg:block">
            <RequirementProgress
              completed={completedCount}
              total={problem.requirementCount}
            />
          </div>
        ) : (
          <span className="hidden shrink-0 text-xs text-[var(--text-secondary)] lg:block">
            {problem.nodeCount} nodes
          </span>
        )}

        <span className="shrink-0 text-xs font-medium text-[var(--accent-primary)] transition-transform duration-200 group-hover:translate-x-0.5">
          Practice →
        </span>
      </div>
    </Link>
  );
}

// ─── List skeleton row ────────────────────────────────────────────────────────

function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--text-primary)]/8 bg-[var(--bg-secondary)] px-4 py-3.5">
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-44 animate-pulse rounded bg-[var(--text-primary)]/10" />
        <div className="h-3 w-64 animate-pulse rounded bg-[var(--text-primary)]/8" />
      </div>
      <div className="h-5 w-[76px] animate-pulse rounded-full bg-[var(--text-primary)]/10" />
      <div className="hidden h-3 w-20 animate-pulse rounded bg-[var(--text-primary)]/8 sm:block" />
      <div className="hidden h-3 w-28 animate-pulse rounded bg-[var(--text-primary)]/8 lg:block" />
      <div className="h-3 w-14 animate-pulse rounded bg-[var(--text-primary)]/8" />
    </div>
  );
}

// ─── Page fallback ────────────────────────────────────────────────────────────

function ProblemsPageFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SkeletonCard />
      </main>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function ProblemsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useAuth();

  const selectedDifficulty = searchParams.get('difficulty') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedSolved = (searchParams.get('solved') ?? '') as
    | 'true'
    | 'false'
    | '';
  const difficultyFilter = DIFFICULTIES.some(
    ({ value }) => value === selectedDifficulty
  )
    ? (selectedDifficulty as Difficulty)
    : '';
  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Pass token so the API embeds isSolved + completedRequirementOrders per problem.
  const {
    data: problemPages,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProblems({
    token: token || undefined,
    difficulty: difficultyFilter,
    category: selectedCategory,
    solved: isAuthenticated ? selectedSolved : '',
  });
  const { data: categoryData } = useProblemCategories();

  // View mode persisted across sessions
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  useEffect(() => {
    const saved = localStorage.getItem('problems-view-mode');
    if (saved === 'card' || saved === 'list') setViewMode(saved);
  }, []);
  const handleViewMode = useCallback((mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('problems-view-mode', mode);
  }, []);

  const problems = useMemo(
    () =>
      problemPages?.pages
        .flatMap((page) => page.data ?? [])
        .filter((problem): problem is ProblemSummary => Boolean(problem?.id)) ??
      [],
    [problemPages]
  );
  const totalProblems = problemPages?.pages[0]?.total ?? 0;

  const fuse = useMemo(
    () =>
      new Fuse(problems, {
        keys: ['title', 'description', 'category'],
        threshold: 0.35,
        includeScore: true,
      }),
    [problems]
  );
  const filteredProblems = useMemo(
    () =>
      searchQuery.trim()
        ? fuse.search(searchQuery).map((r) => r.item)
        : problems,
    [fuse, problems, searchQuery]
  );

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set([
        ...(categoryData ?? []),
        ...(selectedCategory ? [selectedCategory] : []),
      ])
    ).sort();
    return ['All', ...cats];
  }, [categoryData, selectedCategory]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        {/* Page header with aurora radial glow */}
        <div
          className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--text-primary)]/8 px-6 py-8"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 80% at 0% 50%, var(--aurora-color1) 0%, transparent 65%),
              radial-gradient(ellipse 50% 70% at 100% 50%, var(--aurora-color2) 0%, transparent 65%)
            `,
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Problems
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Practice real-world system architectures. Fill in the blanks.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {/* Difficulty pills */}
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Filter by difficulty"
          >
            {DIFFICULTIES.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setFilter('difficulty', value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                  difficultyFilter === value || (!difficultyFilter && !value)
                    ? 'bg-[#00ffa3] text-black shadow-[0_4px_16px_rgba(0,255,163,0.2)] font-bold'
                    : 'bg-black/5 text-[var(--text-secondary)] hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-[#00ffa3]'
                )}
                aria-pressed={
                  difficultyFilter === value || (!difficultyFilter && !value)
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          {categories.length > 1 && (
            <select
              value={selectedCategory || 'All'}
              onChange={(e) =>
                setFilter(
                  'category',
                  e.target.value === 'All' ? '' : e.target.value
                )
              }
              aria-label="Filter by category"
              className="rounded-full border border-[var(--text-primary)]/10 bg-black/5 dark:bg-white/5 px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-black dark:hover:text-[#00ffa3] focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Solved filter (authenticated only) */}
          {isAuthenticated && (
            <select
              value={selectedSolved}
              onChange={(e) => setFilter('solved', e.target.value)}
              aria-label="Filter by solved status"
              className="rounded-full border border-[var(--text-primary)]/10 bg-black/5 dark:bg-white/5 px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-black dark:hover:text-[#00ffa3] focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
            >
              <option value="">All</option>
              <option value="true">Solved</option>
              <option value="false">Unsolved</option>
            </select>
          )}

          {/* Search input */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems…"
              aria-label="Search problems"
              className="rounded-full border border-[var(--text-primary)]/10 bg-black/5 dark:bg-white/5 py-1.5 pl-8 pr-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
            />
          </div>

          {/* Right side: result count + view toggle */}
          <div className="ml-auto flex items-center gap-2">
            {!isLoading && (
              <span className="text-sm text-[var(--text-secondary)]">
                {filteredProblems.length}
                {totalProblems > filteredProblems.length && !searchQuery
                  ? ` of ${totalProblems}`
                  : ''}{' '}
                {filteredProblems.length === 1 ? 'problem' : 'problems'}
              </span>
            )}
            <div
              className="flex items-center rounded-[10px] border border-black/8 dark:border-white/8 bg-black/5 dark:bg-white/5 p-1"
              role="group"
              aria-label="Toggle view mode"
            >
              <button
                type="button"
                onClick={() => handleViewMode('card')}
                aria-pressed={viewMode === 'card'}
                aria-label="Card view"
                className={cn(
                  'rounded-md p-1.5 transition-colors duration-150',
                  viewMode === 'card'
                    ? 'bg-[#00ffa3] text-black shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[#00b37a] dark:hover:text-[#00ffa3]'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
                className={cn(
                  'rounded-md p-1.5 transition-colors duration-150',
                  viewMode === 'list'
                    ? 'bg-[#00ffa3] text-black shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[#00b37a] dark:hover:text-[#00ffa3]'
                )}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Failed to load problems. Make sure the API is running.
          </div>
        )}

        {/* Card grid */}
        {viewMode === 'card' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : filteredProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
            {isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={`next-${i}`} />
              ))}
          </div>
        )}

        {/* List */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonListRow key={i} />
                ))
              : filteredProblems.map((problem) => (
                  <ProblemListRow
                    key={problem.id}
                    problem={problem}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
            {isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonListRow key={`next-${i}`} />
              ))}
          </div>
        )}

        {/* Infinite scroll sentinel — hide when search is active (all results already loaded) */}
        {!searchQuery && (
          <div ref={sentinelRef} className="h-8" aria-hidden="true" />
        )}

        {!isLoading && filteredProblems.length === 0 && !isError && (
          <div className="py-16 text-center text-[var(--text-secondary)]">
            {searchQuery
              ? `No problems match "${searchQuery}".`
              : 'No problems match the selected filters.'}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<ProblemsPageFallback />}>
      <ProblemsPageContent />
    </Suspense>
  );
}
