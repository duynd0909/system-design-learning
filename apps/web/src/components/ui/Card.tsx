import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-6 shadow-sm',
        hover && 'cursor-pointer transition-all duration-200 hover:border-[var(--accent-primary)]/40 hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-display text-lg font-semibold text-[var(--text-primary)]', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-1 text-sm text-[var(--text-secondary)]', className)}>{children}</p>;
}
