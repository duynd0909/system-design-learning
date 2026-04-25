import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--text-primary)]/10',
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-6">
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
