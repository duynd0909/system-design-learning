'use client';

import { useLeaderboard } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span aria-hidden="true">🥇</span>;
  if (rank === 2) return <span aria-hidden="true">🥈</span>;
  if (rank === 3) return <span aria-hidden="true">🥉</span>;
  return <span className="tabular-nums text-[var(--text-secondary)]">#{rank}</span>;
}

export function SocialProofSection() {
  const { data: entries, isLoading, isError } = useLeaderboard();

  if (isError) return null;

  const top5 = entries?.slice(0, 5) ?? [];

  return (
    <section className="bg-[var(--bg-secondary)] px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            Community
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">
            Top Engineers
          </h2>
          {!isLoading && entries && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {entries.length} engineers on the leaderboard — will you top the charts?
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--text-primary)]/8 bg-[var(--bg-primary)]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-[var(--text-primary)]/6 px-5 py-3.5 last:border-0">
                  <Skeleton className="h-5 w-6 rounded" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="ml-auto h-4 w-16 rounded" />
                </div>
              ))
            : top5.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-4 border-b border-[var(--text-primary)]/6 px-5 py-3.5 last:border-0"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-semibold">
                    <RankBadge rank={entry.rank} />
                  </span>
                  <Avatar name={entry.displayName} src={entry.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {entry.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">@{entry.username}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {entry.xp.toLocaleString()} XP
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {entry.passedCount} solved
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
