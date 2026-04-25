'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const iconColors: Record<ToastVariant, string> = {
  success: 'text-[var(--slot-correct)]',
  error: 'text-[var(--slot-incorrect)]',
  info: 'text-[var(--accent-primary)]',
};

function SingleToast({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const Icon = icons[item.variant];

  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), 3000);
    return () => clearTimeout(t);
  }, [item.id, onRemove]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] px-4 py-3 shadow-lg"
    >
      <Icon className={cn('h-4 w-4 shrink-0', iconColors[item.variant])} aria-hidden="true" />
      <span className="text-sm font-medium text-[var(--text-primary)]">{item.message}</span>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="ml-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToasts((prev) => [...prev, { id: String(Date.now() + Math.random()), message, variant }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          className="fixed right-4 top-20 z-[100] flex flex-col gap-2"
        >
          {toasts.map((item) => (
            <SingleToast key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
