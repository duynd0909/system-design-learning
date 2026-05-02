'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProblemError({
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
          Canvas crashed
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          The game canvas hit an unexpected error. Your latest submitted answers are safe on the server.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/problems">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Problems
            </Button>
          </Link>
          <Button type="button" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reload canvas
          </Button>
        </div>
      </section>
    </main>
  );
}
