'use client';

import { useLeaderboard } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function LeaderboardPage() {
  const { data: entries, isLoading, isError } = useLeaderboard();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Leaderboard</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Top engineers by total XP earned.</p>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Failed to load leaderboard.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)]">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-[var(--text-primary)]/10 p-4 last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              ))
            : entries?.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-4 border-b border-[var(--text-primary)]/10 p-4 last:border-0"
                >
                  <span
                    className={`font-display w-8 text-center text-sm font-bold ${
                      entry.rank === 1
                        ? 'text-yellow-500'
                        : entry.rank === 2
                          ? 'text-slate-400'
                          : entry.rank === 3
                            ? 'text-amber-600'
                            : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary)]/20 text-sm font-bold text-[var(--accent-primary)]">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{entry.displayName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">@{entry.username} · Lv.{entry.level}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--accent-game)]">{entry.xp.toLocaleString()} XP</p>
                    <p className="text-xs text-[var(--text-secondary)]">{entry.passedCount} solved</p>
                  </div>
                </div>
              ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
