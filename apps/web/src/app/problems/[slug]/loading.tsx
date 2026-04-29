import { Skeleton } from '@/components/ui/Skeleton';

export default function ProblemLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Header skeleton */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--text-primary)]/10 px-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
      {/* Body: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        <Skeleton className="h-full w-[300px] shrink-0 rounded-none" />
        <div className="flex flex-1 flex-col gap-4 p-8">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-[calc(100%-5rem)] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
