'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-4 py-12">
      <section className="w-full max-w-lg rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-6 text-center shadow-xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--slot-incorrect)]/12 text-[var(--slot-incorrect)]">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">
          Something broke
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          The page could not recover from an unexpected error. Try again, or return to the previous page.
        </p>
        <Button type="button" onClick={reset} className="mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </section>
    </main>
  );
}
