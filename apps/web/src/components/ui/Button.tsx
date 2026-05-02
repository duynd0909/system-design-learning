import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white hover:opacity-90 shadow-sm hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)] focus-visible:ring-[var(--accent-primary)]',
  secondary: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)] focus-visible:ring-[var(--accent-primary)]',
  ghost: 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] focus-visible:ring-[var(--accent-primary)]',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
