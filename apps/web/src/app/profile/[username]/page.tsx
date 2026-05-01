'use client';

import type React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Award, BookOpen } from 'lucide-react';
import { usePublicProfile } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { fadeUp, spring, STAGGER } from '@/lib/animations';

const CATEGORY_COLORS = [
  'var(--accent-primary)',
  'var(--accent-game)',
  'var(--slot-correct)',
  '#8B5CF6',
  '#EC4899',
];

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const prefersReduced = useReducedMotion();

  const { data: profile, isLoading, isError } = usePublicProfile(username);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
          <Skeleton className="mb-6 h-32 w-full rounded-2xl" />
          <Skeleton className="mb-4 h-16 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Profile not found</h1>
          <p className="mt-3 text-[var(--text-secondary)]">This user doesn&apos;t exist or their profile is unavailable.</p>
          <Link
            href="/problems"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Browse Problems
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryEntries = Object.entries(profile.categoryBreakdown);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {/* Profile header card */}
        <motion.div
          initial={prefersReduced ? undefined : fadeUp.initial}
          animate={prefersReduced ? undefined : fadeUp.animate}
          transition={spring}
          className="mb-6 rounded-2xl border border-[var(--text-primary)]/8 bg-[var(--bg-secondary)] p-6"
        >
          <div className="flex items-start gap-5">
            <Avatar
              name={profile.displayName}
              src={profile.avatarUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  {profile.displayName}
                </h1>
                <Badge variant="level">Lv. {profile.level}</Badge>
                {profile.streak >= 1 && <StreakBadge streak={profile.streak} />}
              </div>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">@{profile.username}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                <span style={{ color: 'var(--accent-primary)' }}>{profile.xp.toLocaleString()}</span>{' '}
                XP
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={prefersReduced ? undefined : fadeUp.initial}
          animate={prefersReduced ? undefined : fadeUp.animate}
          transition={{ ...spring, delay: 0.05 }}
          className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Problems Solved" value={String(profile.solvedCount)} />
          <StatCard icon={<Award className="h-5 w-5" />} label="Current Streak" value={`${profile.streak} day${profile.streak !== 1 ? 's' : ''}`} />
          <StatCard icon={null} label="Total XP" value={profile.xp.toLocaleString()} className="col-span-2 sm:col-span-1" />
        </motion.div>

        {/* Category breakdown */}
        {categoryEntries.length > 0 && (
          <motion.section
            initial={prefersReduced ? undefined : { opacity: 0 }}
            animate={prefersReduced ? undefined : { opacity: 1 }}
            transition={{ ...spring, delay: 0.1 }}
            aria-label="Category progress"
          >
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Category Progress
            </h2>
            <motion.div
              variants={prefersReduced ? undefined : { animate: STAGGER }}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3"
            >
              {categoryEntries.map(([cat, { solved, total }], i) => {
                const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <motion.div
                    key={cat}
                    variants={prefersReduced ? undefined : { initial: fadeUp.initial, animate: fadeUp.animate }}
                    className="flex items-center gap-4 rounded-xl border border-[var(--text-primary)]/8 bg-[var(--bg-secondary)] p-4"
                  >
                    <ProgressRing
                      percentage={pct}
                      size={56}
                      strokeWidth={5}
                      color={color}
                      aria-label={`${cat}: ${solved} of ${total} solved`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{cat}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-[var(--text-secondary)]">
                        {solved}/{total}
                      </p>
                      <p className="text-xs font-medium" style={{ color }}>{pct}%</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--text-primary)]/8 bg-[var(--bg-secondary)] p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
