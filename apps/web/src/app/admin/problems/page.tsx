'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAdminProblems } from '@/lib/api';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProblemRowActions } from '@/components/admin/ProblemRowActions';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@stackdify/shared-types';

type StatusTab = 'all' | 'published' | 'hidden' | 'deleted';

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'deleted', label: 'Deleted' },
];

export default function AdminProblemsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const activeTab = (searchParams.get('status') ?? 'all') as StatusTab;

  const queryStatus = activeTab === 'all' ? undefined : activeTab;
  const { data: problems, isLoading } = useAdminProblems(token, queryStatus);

  const filtered = useMemo(() => {
    if (!problems) return [];
    if (!search.trim()) return problems;
    const fuse = new Fuse(problems, { keys: ['title', 'slug'], threshold: 0.4 });
    return fuse.search(search.trim()).map((r) => r.item);
  }, [problems, search]);

  const setTab = (tab: StatusTab) => {
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('status', tab);
    router.push(`/admin/problems?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Problems</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Manage all system design problems.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => router.push('/admin/problems/new')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Problem
        </Button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[var(--text-primary)]/12 bg-[var(--bg-secondary)] p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                activeTab === key
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
          <Input
            placeholder="Search problems…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm h-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--text-primary)]/10 bg-[var(--text-primary)]/4">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Problem</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:table-cell">Difficulty</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] md:table-cell">Category</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:table-cell">Reqs</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] md:table-cell">Subs</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--text-primary)]/8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <Skeleton className="h-6 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                  {search ? 'No problems match your search.' : 'No problems found.'}
                  {!search && activeTab === 'all' && (
                    <> <Link href="/admin/problems/new" className="font-semibold text-[var(--accent-primary)] hover:underline">Create one →</Link></>
                  )}
                </td>
              </tr>
            ) : filtered.map((problem) => (
              <tr key={problem.id} className="hover:bg-[var(--text-primary)]/4 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">{problem.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{problem.slug}</div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <DifficultyBadge difficulty={problem.difficulty as Difficulty} />
                </td>
                <td className="hidden px-4 py-3 text-xs text-[var(--text-secondary)] md:table-cell">{problem.category}</td>
                <td className="px-4 py-3 text-center">
                  {problem.deletedAt ? (
                    <span className="inline-flex items-center rounded-full bg-[var(--slot-incorrect)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--slot-incorrect)]">Deleted</span>
                  ) : problem.isPublished ? (
                    <span className="inline-flex items-center rounded-full bg-[var(--slot-correct)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--slot-correct)]">Published</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[var(--text-secondary)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">Hidden</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-center text-xs text-[var(--text-secondary)] sm:table-cell">{problem.requirementCount}</td>
                <td className="hidden px-4 py-3 text-center text-xs text-[var(--text-secondary)] md:table-cell">{problem.submissionCount}</td>
                <td className="px-4 py-3 text-right">
                  <ProblemRowActions problem={problem} token={token} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
