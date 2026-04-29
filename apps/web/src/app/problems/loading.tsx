import { Navbar } from '@/components/layout/Navbar';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function ProblemsLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Filter bar skeleton */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-[var(--text-primary)]/10" />
          ))}
        </div>
        {/* Problem cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
