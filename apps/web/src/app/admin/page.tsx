'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  BarChart2,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAdminStats } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DifficultyBadge } from '@/components/ui/Badge';
import { AreaChart } from '@/components/ui/charts/AreaChart';
import { LineChart } from '@/components/ui/charts/LineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { PieChart } from '@/components/ui/charts/PieChart';
import { fadeUp, spring, STAGGER } from '@/lib/animations';
import type { Difficulty } from '@stackdify/shared-types';

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function KpiCard({ icon, label, value, sub, accent }: KpiCardProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? undefined : fadeUp.initial}
      animate={prefersReduced ? undefined : fadeUp.animate}
      transition={spring}
      className="rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="font-display text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{sub}</div>}
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { data: stats, isLoading } = useAdminStats(token);
  const prefersReduced = useReducedMotion();

  const diffData = stats
    ? [
        { name: 'Easy', value: stats.difficultyDistribution.EASY, color: '#10b981' },
        { name: 'Medium', value: stats.difficultyDistribution.MEDIUM, color: '#f59e0b' },
        { name: 'Hard', value: stats.difficultyDistribution.HARD, color: '#ef4444' },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Overview</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Platform statistics at a glance.</p>
      </div>

      {/* KPI row */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : stats ? (
        <motion.div
          variants={{ animate: STAGGER }}
          initial={prefersReduced ? undefined : 'initial'}
          animate={prefersReduced ? undefined : 'animate'}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <KpiCard icon={<BookOpen className="h-3.5 w-3.5" />} label="Problems" value={stats.totals.problems} accent="var(--accent-primary)" />
          <KpiCard icon={<Eye className="h-3.5 w-3.5" />} label="Published" value={stats.totals.publishedProblems} accent="var(--slot-correct)" />
          <KpiCard icon={<EyeOff className="h-3.5 w-3.5" />} label="Hidden" value={stats.totals.hiddenProblems} accent="var(--text-secondary)" />
          <KpiCard icon={<Users className="h-3.5 w-3.5" />} label="Users" value={stats.totals.users} accent="var(--accent-game)" />
          <KpiCard icon={<Layers className="h-3.5 w-3.5" />} label="Submissions" value={stats.totals.submissions.toLocaleString()} accent="var(--accent-primary)" />
          <KpiCard icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Pass Rate" value={`${stats.totals.passRate}%`} accent="var(--slot-correct)" sub="overall" />
        </motion.div>
      ) : null}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <CardTitle className="text-sm">Submissions (30 days)</CardTitle>
            </div>
          </CardHeader>
          <AreaChart
            data={stats?.submissionsPerDay ?? []}
            isLoading={isLoading}
            color="#818cf8"
            label="submissions"
            className="h-44 w-full"
          />
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <CardTitle className="text-sm">New Users (30 days)</CardTitle>
            </div>
          </CardHeader>
          <LineChart
            data={stats?.newUsersPerDay ?? []}
            isLoading={isLoading}
            color="#fcd34d"
            label="users"
            className="h-44 w-full"
          />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <CardTitle className="text-sm">Pass Rate by Problem</CardTitle>
            </div>
          </CardHeader>
          <BarChart
            data={stats?.passRateByProblem ?? []}
            isLoading={isLoading}
            color="#34d399"
            className="h-52 w-full"
          />
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <CardTitle className="text-sm">Difficulty Distribution</CardTitle>
            </div>
          </CardHeader>
          <PieChart data={diffData} isLoading={isLoading} className="h-52 w-full" />
        </Card>
      </div>

      {/* Problem quality table + recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Problem Quality</CardTitle>
              <Link href="/admin/problems" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline">
                Manage →
              </Link>
            </div>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
          ) : (
            <div className="divide-y divide-[var(--text-primary)]/8">
              {(stats?.problemQuality ?? []).slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-2 text-xs">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${p.isPublished ? 'bg-[var(--slot-correct)]' : 'bg-[var(--text-secondary)]/40'}`} />
                  <Link href={`/admin/problems/${p.slug}/edit`} className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)]">
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-[var(--text-secondary)]">{p.submissionCount} sub</span>
                  <span className="shrink-0 font-semibold text-[var(--slot-correct)]">{p.passRate}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-4">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : (
            <div className="divide-y divide-[var(--text-primary)]/8">
              {(stats?.recentSubmissions ?? []).map((sub) => (
                <div key={sub.id} className="flex items-center gap-2.5 py-2">
                  <div
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${sub.passed ? 'bg-[var(--slot-correct)]/15 text-[var(--slot-correct)]' : 'bg-[var(--slot-incorrect)]/15 text-[var(--slot-incorrect)]'}`}
                    aria-label={sub.passed ? 'Passed' : 'Failed'}
                  >
                    {sub.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[var(--text-primary)]">{sub.user.displayName}</div>
                    <div className="truncate text-[10px] text-[var(--text-secondary)]">{sub.problem.title}</div>
                  </div>
                  <DifficultyBadge difficulty={'MEDIUM' as Difficulty} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Deleted problems banner */}
      {stats && stats.totals.deletedProblems > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--slot-incorrect)]/30 bg-[var(--slot-incorrect)]/8 px-4 py-3">
          <Trash2 className="h-4 w-4 shrink-0 text-[var(--slot-incorrect)]" aria-hidden="true" />
          <p className="text-sm text-[var(--text-primary)]">
            {stats.totals.deletedProblems} problem{stats.totals.deletedProblems !== 1 ? 's' : ''} soft-deleted.{' '}
            <Link href="/admin/problems?status=deleted" className="font-semibold text-[var(--accent-primary)] hover:underline">
              View and restore →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
