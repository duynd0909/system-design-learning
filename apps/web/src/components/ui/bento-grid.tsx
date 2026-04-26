import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: 1 | 2 | 3;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

function colSpanClass(colSpan: BentoItem['colSpan']) {
  switch (colSpan) {
    case 2:
      return 'md:col-span-2';
    case 3:
      return 'md:col-span-3';
    default:
      return 'md:col-span-1';
  }
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-3', className)}>
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className={cn(
            'group relative col-span-1 min-h-[190px] overflow-hidden rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-300 will-change-transform dark:border-white/10 dark:bg-black/80',
            'hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:hover:border-white/20 dark:hover:shadow-[0_12px_32px_rgba(255,255,255,0.05)]',
            colSpanClass(item.colSpan),
            item.hasPersistentHover &&
              '-translate-y-0.5 border-gray-300 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-white/20 dark:shadow-[0_12px_32px_rgba(255,255,255,0.05)]',
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0 transition-opacity duration-300',
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[length:4px_4px] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          </div>

          <div className="relative flex h-full flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 transition-colors duration-300 group-hover:bg-black/10 dark:bg-white/10 dark:group-hover:bg-white/15"
              >
                {item.icon}
              </div>
              {item.status && (
                <span className="rounded-lg bg-black/5 px-2 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm transition-colors duration-300 group-hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:group-hover:bg-white/20">
                  {item.status}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-[15px] font-medium text-gray-950 dark:text-gray-100">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm font-[425] leading-snug text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-black/5 px-2 py-1 backdrop-blur-sm transition-colors duration-200 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {item.cta && (
                <span className="whitespace-nowrap text-xs text-gray-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-gray-400">
                  {item.cta}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
