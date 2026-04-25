import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]',
            'transition-colors placeholder:text-[var(--text-secondary)]/50',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-1',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-[var(--text-primary)]/20 hover:border-[var(--accent-primary)]/50',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
