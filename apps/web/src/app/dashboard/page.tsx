'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  Award,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Difficulty } from '@stackdify/shared-types';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { DifficultyBadge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { useMe, useMyStats, useMyActivity, useMySubmissions } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fadeUp, spring } from '@/lib/animations';

// ─── Activity Heatmap ────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function heatColor(count: number) {
  if (count === 0) return 'bg-[var(--text-primary)]/8';
  if (count === 1) return 'bg-[var(--accent-primary)]/30';
  if (count <= 3) return 'bg-[var(--accent-primary)]/55';
  if (count <= 6) return 'bg-[var(--accent-primary)]/80';
  return 'bg-[var(--accent-primary)]';
}

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // data is 90 days, oldest first
  // We render 13 columns of 7 rows (91 cells; trim to 90)
  const cells = [...data];
  while (cells.length < 91) cells.unshift({ date: '', count: -1 }); // pad front

  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < 13; i++) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  // Month labels: find the first cell of each month in the grid
  const monthPositions: Array<{ col: number; label: string }> = [];
  weeks.forEach((week, wi) => {
    week.forEach((cell) => {
      if (cell.date) {
        const d = new Date(cell.date + 'T00:00:00');
        if (d.getDate() <= 7) {
          if (!monthPositions.find((m) => m.col === wi)) {
            monthPositions.push({ col: wi, label: MONTH_LABELS[d.getMonth()] });
          }
        }
      }
    });
  });

  return (
    <div className="overflow-x-auto">
      {/* Month row */}
      <div className="mb-1 flex gap-1 pl-8">
        {weeks.map((_, wi) => {
          const mp = monthPositions.find((m) => m.col === wi);
          return (
            <div key={wi} className="w-3 shrink-0 text-[9px] text-[var(--text-secondary)]">
              {mp ? mp.label : ''}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={cn('h-3 text-[9px] leading-3 text-[var(--text-secondary)]', i % 2 === 0 ? 'opacity-0' : '')}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date ? `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}` : ''}
                className={cn(
                  'h-3 w-3 rounded-sm transition-colors',
                  cell.count < 0 ? 'opacity-0' : heatColor(cell.count),
                )}
                aria-label={cell.date ? `${cell.date}: ${cell.count} submissions` : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
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
      <div className="font-display text-3xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{sub}</div>}
    </motion.div>
  );
}

// ─── Category Ring ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Social Media':              'var(--accent-primary)',
  'Video Streaming':           '#f59e0b',
  'Messaging':                 '#10b981',
  'Real-Time Communication':   '#06b6d4',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'var(--text-secondary)';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { token, isAuthenticated, isReady } = useAuth();
  const { data: user, isLoading: userLoading } = useMe(token);
  const { data: stats, isLoading: statsLoading } = useMyStats(token);
  const { data: activity, isLoading: activityLoading } = useMyActivity(token);
  const { data: submissionsPage, isLoading: subsLoading } = useMySubmissions(token, 1, 10);

  const isLoading = userLoading || statsLoading || activityLoading || subsLoading;

  if (!isReady) return null;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Navbar />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Sign in to view your dashboard</h1>
          <p className="mt-3 text-[var(--text-secondary)]">Track your progress, activity, and solved problems.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </main>
      </div>
    );
  }

  const recentSubmissions = submissionsPage?.data ?? [];
  const categories = stats ? Object.entries(stats.categoryBreakdown) : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Welcome header */}
        <div className="mb-8">
          {isLoading ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Welcome back, {user?.displayName ?? user?.username ?? 'engineer'}
            </h1>
          )}
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Here's your practice progress at a glance.</p>
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Total XP"
              value={stats.totalXp.toLocaleString()}
              sub={`Level ${stats.level}`}
              accent="var(--accent-game)"
            />
            <StatCard
              icon={<Flame className="h-3.5 w-3.5" />}
              label="Streak"
              value={stats.streak}
              sub="days"
              accent="#f97316"
            />
            <StatCard
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Solved"
              value={stats.solved}
              sub={`of ${categories.reduce((s, [, v]) => s + v.total, 0)} problems`}
              accent="var(--slot-correct)"
            />
            <StatCard
              icon={<Target className="h-3.5 w-3.5" />}
              label="Accuracy"
              value={`${stats.accuracy}%`}
              sub={`${stats.passedSubmissions}/${stats.totalSubmissions} passed`}
              accent="var(--accent-primary)"
            />
            <StatCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Avg Score"
              value={`${stats.averageScore}%`}
              sub="across all attempts"
              accent="var(--text-secondary)"
            />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: activity + recent submissions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Activity heatmap */}
            <Card className="p-5">
              <CardHeader className="mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                  <CardTitle className="text-base">Activity — last 90 days</CardTitle>
                </div>
              </CardHeader>
              {activityLoading ? (
                <Skeleton className="h-20 w-full rounded-lg" />
              ) : activity ? (
                <ActivityHeatmap data={activity} />
              ) : null}
            </Card>

            {/* Recent submissions */}
            <Card className="p-5">
              <CardHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                    <CardTitle className="text-base">Recent Submissions</CardTitle>
                  </div>
                  <Link
                    href="/problems"
                    className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    Practice more →
                  </Link>
                </div>
              </CardHeader>

              {subsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : recentSubmissions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
                  No submissions yet. <Link href="/problems" className="font-semibold text-[var(--accent-primary)] hover:underline">Start a problem!</Link>
                </p>
              ) : (
                <div className="divide-y divide-[var(--text-primary)]/8">
                  {recentSubmissions.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                          sub.passed ? 'bg-[var(--slot-correct)]/15 text-[var(--slot-correct)]' : 'bg-[var(--slot-incorrect)]/15 text-[var(--slot-incorrect)]',
                        )}
                        aria-label={sub.passed ? 'Passed' : 'Failed'}
                      >
                        {sub.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/problems/${sub.problem.slug}`}
                          className="block truncate text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                        >
                          {sub.problem.title}
                          {sub.requirementOrder ? ` · Req ${sub.requirementOrder}` : ''}
                        </Link>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {new Date(sub.createdAt).toLocaleDateString()}
                          {sub.xpEarned > 0 ? ` · +${sub.xpEarned} XP` : ''}
                        </div>
                      </div>
                      <DifficultyBadge difficulty={sub.problem.difficulty as Difficulty} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column: category progress */}
          <div className="space-y-6">
            <Card className="p-5">
              <CardHeader className="mb-5">
                <CardTitle className="text-base">Progress by Category</CardTitle>
              </CardHeader>

              {statsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)]">Play some problems to see your progress.</p>
              ) : (
                <div className="space-y-5">
                  {categories.map(([cat, { solved, total }]) => {
                    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
                    const color = categoryColor(cat);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <ProgressRing
                          percentage={pct}
                          size={44}
                          strokeWidth={4}
                          color={color}
                          aria-label={`${cat}: ${pct}%`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{cat}</div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {solved}/{total} solved · {pct}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Quick links */}
            <Card className="p-5">
              <CardTitle className="mb-3 text-base">Keep Going</CardTitle>
              <div className="space-y-2">
                <Link
                  href="/problems"
                  className="flex items-center gap-2 rounded-lg bg-[var(--accent-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Browse all problems
                </Link>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)]/5 px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--text-primary)]/10"
                >
                  <Award className="h-4 w-4" aria-hidden="true" />
                  View leaderboard
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
