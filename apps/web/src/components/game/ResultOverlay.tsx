'use client';

import Link from 'next/link';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { SubmissionResponse } from '@joy/shared-types';
import { Button } from '@/components/ui/Button';

interface ResultOverlayProps {
  result: SubmissionResponse;
  onRetry: () => void;
}

function resultMessage(result: SubmissionResponse) {
  if (result.passed) return 'Clean architecture. The diagram gods are pleased.';
  if (result.score >= 50) return 'Half the system is humming. The other half is paging you.';
  return 'That system would make on-call spicy. Give it another pass.';
}

export function ResultOverlay({ result, onRetry }: ResultOverlayProps) {
  const Icon = result.passed ? CheckCircle2 : XCircle;
  const scoreColor = result.passed ? 'var(--slot-correct)' : 'var(--slot-incorrect)';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] p-6 text-center shadow-xl">
        <Icon
          className="mx-auto h-9 w-9"
          style={{ color: scoreColor }}
          aria-hidden="true"
        />
        <h2 className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
          {result.passed ? 'Passed' : 'Try again'}
        </h2>

        <div className="relative mx-auto my-6 grid h-36 w-36 place-items-center rounded-full">
          <svg className="absolute h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-[var(--text-primary)]/10"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={scoreColor}
              strokeLinecap="round"
              strokeWidth="10"
              pathLength={100}
              strokeDasharray={`${result.score} 100`}
            />
          </svg>
          <div className="relative">
            <div className="font-display text-4xl font-bold text-[var(--text-primary)]">{result.score}%</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">score</div>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">{resultMessage(result)}</p>
        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
          XP earned: <span style={{ color: scoreColor }}>{result.xpEarned}</span>
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Link
            href="/problems"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Back to problems
          </Link>
        </div>
      </div>
    </div>
  );
}
