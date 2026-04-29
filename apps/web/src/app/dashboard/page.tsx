'use client';

import { useState } from 'react';
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
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { DifficultyBadge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { useMe, useMyStats, useMyActivity, useMySubmissions } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fadeUp, spring } from '@/lib/animations';

// ─── Activity Heatmap ────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function heatColor(count: number) {
  if (count === 0) return 'bg-[var(--text-primary)]/8';
  if (count === 1) return 'bg-[var(--accent-primary)]/30';
  if (count <= 3) return 'bg-[var(--accent-primary)]/55';
  if (count <= 6) return 'bg-[var(--accent-primary)]/80';
  return 'bg-[var(--accent-primary)]';
}

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
  year: number;
}

function ActivityHeatmap({ data, year }: ActivityHeatmapProps) {
  const countMap = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();

  // Grid: Sunday on/before Jan 1 → Saturday on/after Dec 31
  const jan1 = new Date(year, 0, 1);
  const gridStart = new Date(jan1);
  gridStart.setDate(jan1.getDate() - jan1.getDay());

  const dec31 = new Date(year, 11, 31);
  const gridEnd = new Date(dec31);
  gridEnd.setDate(dec31.getDate() + (6 - dec31.getDay()));

  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const numWeeks = totalDays / 7;

  // Build week columns
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: Array<{ date: string; count: number }> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const inYear = date.getFullYear() === year;
      const isFuture = date > today;
      if (!inYear || isFuture) {
        week.push({ date: '', count: -1 });
      } else {
        const dateStr = date.toISOString().slice(0, 10);
        week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
      }
    }
    weeks.push(week);
  }

  // One label per month, at the first column that contains a day ≤ 7 of that month
  const monthPositions: Array<{ col: number; label: string }> = [];
  const seenMonths = new Set<number>();
  weeks.forEach((week, wi) => {
    for (const cell of week) {
      if (cell.date) {
        const d = new Date(cell.date + 'T00:00:00');
        const month = d.getMonth();
        if (d.getDate() <= 7 && !seenMonths.has(month)) {
          seenMonths.add(month);
          monthPositions.push({ col: wi, label: MONTH_LABELS[month] });
        }
      }
    }
  });

  const DAY_COL_W = 28; // px — fixed width of the day-label column

  return (
    <div className="w-full select-none">
      {/* Month labels — absolutely positioned over the grid area */}
      <div className="relative mb-1 h-4" style={{ paddingLeft: DAY_COL_W }}>
        {monthPositions.map(({ col, label }) => (
          <span
            key={label}
            className="absolute whitespace-nowrap text-[10px] text-[var(--text-secondary)]"
            style={{ left: `calc(${DAY_COL_W}px + ${(col / numWeeks) * 100}%)` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex w-full items-stretch gap-1.5">
        {/* Day labels */}
        <div
          className="flex shrink-0 flex-col justify-around"
          style={{ width: DAY_COL_W }}
        >
          {DAY_ABBR.map((label, i) => (
            <span
              key={label}
              className={cn('text-[9px] leading-none text-[var(--text-secondary)]', i % 2 === 0 ? 'invisible' : '')}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Cell grid — fills remaining width, cells are square via aspect-ratio */}
        <div
          className="min-w-0 flex-1"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${numWeeks}, 1fr)`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            gap: '3px',
            aspectRatio: `${numWeeks} / 7`,
          }}
        >
          {weeks.flatMap((week, wi) =>
            week.map((cell, di) => (
              <div
                key={`${wi}-${di}`}
                title={cell.count >= 0 ? `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}` : undefined}
                className={cn(
                  'rounded-[2px] transition-colors',
                  cell.count < 0 ? 'opacity-0' : heatColor(cell.count),
                )}
                aria-label={cell.date && cell.count >= 0 ? `${cell.date}: ${cell.count} submissions` : undefined}
              />
            ))
          )}
        </div>
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
  const { data: submissionsPage, isLoading: subsLoading } = useMySubmissions(token, 1, 10);

  const currentYear = new Date().getFullYear();
  const [activityYear, setActivityYear] = useState(currentYear);
  const availableYears = [currentYear - 1, currentYear];
  const { data: activity, isLoading: activityLoading } = useMyActivity(token, activityYear);

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
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                    <CardTitle className="text-base">Activity</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {availableYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setActivityYear(y)}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                          y === activityYear
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              {activityLoading ? (
                <Skeleton className="h-28 w-full rounded-lg" />
              ) : activity ? (
                <ActivityHeatmap data={activity} year={activityYear} />
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
      <Footer />
    </div>
  );
}
