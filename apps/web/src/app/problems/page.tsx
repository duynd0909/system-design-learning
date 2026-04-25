'use client';

import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { Difficulty } from '@stackdify/shared-types';
import { useProblems, useMySubmissions } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

const DIFFICULTIES = [
  { label: 'All', value: '' },
  { label: 'Easy', value: Difficulty.EASY },
  { label: 'Medium', value: Difficulty.MEDIUM },
  { label: 'Hard', value: Difficulty.HARD },
];

export default function ProblemsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const { data: problems, isLoading, isError } = useProblems();
  const { data: submissions } = useMySubmissions(token ?? '', 1, 100);

  const selectedDifficulty = searchParams.get('difficulty') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';

  const completedSlugs = useMemo(() => {
    return new Set(
      submissions?.data
        ?.filter((s) => s.passed)
        .map((s) => s.problem.slug) ?? [],
    );
  }, [submissions?.data]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(problems?.map((p) => p.category) ?? [])).sort();
    return ['All', ...cats];
  }, [problems]);

  const filtered = useMemo(() => {
    return (problems ?? []).filter((p) => {
      const matchesDifficulty = !selectedDifficulty || p.difficulty === selectedDifficulty;
      const matchesCategory = !selectedCategory || selectedCategory === 'All' || p.category === selectedCategory;
      return matchesDifficulty && matchesCategory;
    });
  }, [problems, selectedDifficulty, selectedCategory]);

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
    [pathname, router, searchParams],
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
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
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Problems</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Practice real-world system architectures. Fill in the blanks.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {/* Difficulty pills */}
          <div className="flex items-center gap-2" role="group" aria-label="Filter by difficulty">
            {DIFFICULTIES.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setFilter('difficulty', value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  (selectedDifficulty === value || (!selectedDifficulty && !value))
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white shadow-sm'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
                aria-pressed={selectedDifficulty === value || (!selectedDifficulty && !value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          {categories.length > 1 && (
            <select
              value={selectedCategory || 'All'}
              onChange={(e) => setFilter('category', e.target.value === 'All' ? '' : e.target.value)}
              aria-label="Filter by category"
              className="rounded-full border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Result count */}
          {!isLoading && (
            <span className="ml-auto text-sm text-[var(--text-secondary)]">
              {filtered.length} {filtered.length === 1 ? 'problem' : 'problems'}
            </span>
          )}
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Failed to load problems. Make sure the API is running.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((problem) => (
                <Link key={problem.id} href={`/problems/${problem.slug}`} className="group block">
                  <Card
                    hover
                    className="h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(79,70,229,0.15)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <div className="flex items-center gap-2">
                        {isAuthenticated && completedSlugs.has(problem.slug) ? (
                          <Badge variant="level" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Solved
                          </Badge>
                        ) : null}
                        <span className="text-xs text-[var(--text-secondary)]">{problem.nodeCount} nodes</span>
                      </div>
                    </div>
                    <CardTitle className="mb-2">{problem.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{problem.description}</CardDescription>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{problem.category}</span>
                      <span className="text-xs font-medium text-[var(--accent-primary)] transition-all group-hover:translate-x-0.5">
                        Practice →
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
        </div>

        {!isLoading && filtered.length === 0 && !isError && (
          <div className="py-16 text-center text-[var(--text-secondary)]">
            No problems match the selected filters.
          </div>
        )}
      </main>
    </div>
  );
}
