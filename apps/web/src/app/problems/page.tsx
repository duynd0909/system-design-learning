'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { useProblems, useMySubmissions } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ProblemsPage() {
  const { token, isAuthenticated } = useAuth();
  const { data: problems, isLoading, isError } = useProblems();
  const { data: submissions } = useMySubmissions(token, 1, 100);
  const completedSlugs = useMemo(() => {
    return new Set(submissions?.data.filter((submission) => submission.passed).map((submission) => submission.problem.slug));
  }, [submissions?.data]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Problems</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Practice real-world system architectures. Fill in the blanks.
          </p>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Failed to load problems. Make sure the API is running.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : problems?.map((problem) => (
                <Link key={problem.id} href={`/problems/${problem.slug}`}>
                  <Card hover className="h-full">
                    <div className="mb-3 flex items-start justify-between">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <div className="flex items-center gap-2">
                        {isAuthenticated && completedSlugs.has(problem.slug) ? (
                          <Badge variant="level" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Completed
                          </Badge>
                        ) : null}
                        <span className="text-xs text-[var(--text-secondary)]">{problem.nodeCount} nodes</span>
                      </div>
                    </div>
                    <CardTitle className="mb-2">{problem.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{problem.description}</CardDescription>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{problem.category}</span>
                      <span className="text-xs font-medium text-[var(--accent-primary)]">Practice →</span>
                    </div>
                  </Card>
                </Link>
              ))}
        </div>
      </main>
    </div>
  );
}
