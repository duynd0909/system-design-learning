'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, ChevronDown, Share2, RotateCcw, ArrowRight } from 'lucide-react';
import type { SubmissionResponse, ComponentType } from '@stackdify/shared-types';
import { Button } from '@/components/ui/button';
import { XpCounter } from '@/components/ui/XpCounter';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { cn } from '@/lib/utils';
import { scaleIn, spring } from '@/lib/animations';

const PASS_MESSAGES = [
  '🏆 Clean architecture. The diagram gods are pleased.',
  '🎉 Perfect design! On-call engineers everywhere rejoice.',
  '✨ Flawless. Your system would handle Black Friday with ease.',
  '🚀 Zero incidents. Your SRE team is on vacation.',
];

const FAIL_MESSAGES = [
  '🔥 That system would make on-call spicy. Give it another pass.',
  '📟 Half the system is humming. The other half is paging you.',
  '🤔 Almost! Every senior engineer started exactly here.',
  '💡 Good attempt — the architecture wants one more try.',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CIRCUMFERENCE = 2 * Math.PI * 52;

interface ResultOverlayProps {
  result: SubmissionResponse;
  componentTypes: ComponentType[];
  onRetry: () => void;
  onDismiss?: () => void;
  nextProblemSlug?: string | null;
  onShare?: () => Promise<void>;
  isSharing?: boolean;
}

export function ResultOverlay({ result, componentTypes, onRetry, onDismiss, nextProblemSlug, onShare, isSharing }: ResultOverlayProps) {
  const prefersReduced = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message] = useState(() =>
    result.passed ? randomPick(PASS_MESSAGES) : randomPick(FAIL_MESSAGES),
  );

  const componentBySlug = new Map(componentTypes.map((c) => [c.slug, c]));
  const scoreColor = result.passed ? 'var(--slot-correct)' : 'var(--slot-incorrect)';

  // Focus management: move focus to heading on mount
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Confetti for pass
  useEffect(() => {
    if (result.passed && !prefersReduced) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  }, [result.passed, prefersReduced]);

  const handleShare = async () => {
    try {
      if (onShare) {
        await onShare();
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied or share API failed — silently ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Submission result"
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-sm"
    >
      <motion.div
        initial={prefersReduced ? undefined : scaleIn.initial}
        animate={prefersReduced ? undefined : scaleIn.animate}
        transition={spring}
        aria-live="polite"
        className="w-full max-w-md rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-primary)] p-6 text-center shadow-xl dark:shadow-[0_32px_80px_rgba(0,255,163,0.07)]"
      >
        {/* Score ring */}
        <div className="relative mx-auto my-4 grid h-36 w-36 place-items-center">
          <svg className="absolute h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="currentColor" strokeWidth="10"
              className="text-[var(--text-primary)]/10"
            />
            <motion.circle
              cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor} strokeLinecap="round" strokeWidth="10"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - result.score / 100) }}
              transition={prefersReduced
                ? { duration: 0 }
                : { duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }
              }
            />
          </svg>
          <motion.div
            animate={!result.passed && !prefersReduced ? {
              x: [0, -8, 8, -4, 4, 0],
              transition: { duration: 0.5, ease: 'easeOut', delay: 0.6 },
            } : undefined}
          >
            <div className="font-display text-4xl font-bold text-[var(--text-primary)]">{result.score}%</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">score</div>
          </motion.div>
        </div>

        {/* Heading — receives focus for screen readers */}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl font-bold text-[var(--text-primary)] outline-none"
        >
          {result.passed ? 'Passed! 🎉' : 'Keep at it'}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
          XP earned:{' '}
          <XpCounter
            to={result.xpEarned}
            className="font-semibold"
            colorVar={scoreColor}
          />
        </p>
        {result.xpBreakdown && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {[
              result.xpBreakdown.base > 0 && `+${result.xpBreakdown.base} first pass`,
              result.xpBreakdown.attempt > 0 && `+${result.xpBreakdown.attempt} attempt`,
              result.xpBreakdown.streakBonus > 0 && `+${result.xpBreakdown.streakBonus} streak bonus`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {result.streakAfter != null && result.streakAfter >= 1 && (
          <div className="mt-2 flex justify-center">
            <StreakBadge streak={result.streakAfter} animate={result.passed} />
          </div>
        )}

        {/* Primary actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {result.passed ? (
            <>
              <Button type="button" variant="secondary" onClick={onRetry}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              {nextProblemSlug ? (
                <Link
                  href={`/problems/${nextProblemSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ffa3] px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-[#00ffa3]/90 shadow-[0_4px_16px_rgba(0,255,163,0.25)]"
                >
                  Next Problem
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/problems"
                  className="inline-flex items-center justify-center rounded-lg bg-[#00ffa3] px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-[#00ffa3]/90 shadow-[0_4px_16px_rgba(0,255,163,0.25)]"
                >
                  Back to Problems
                </Link>
              )}
            </>
          ) : (
            <>
              {onDismiss && (
                <Button type="button" onClick={onDismiss} className="bg-[#00ffa3] text-black font-bold hover:bg-[#00ffa3]/90 shadow-[0_4px_16px_rgba(0,255,163,0.25)]">
                  Edit Answers
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={onRetry}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset All
              </Button>
              <Link
                href="/problems"
                className="col-span-full inline-flex items-center justify-center rounded-lg border border-[var(--text-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Back to Problems
              </Link>
            </>
          )}
        </div>

        {/* Secondary actions */}
        <div className="mt-3 flex gap-3">
          <Button
            type="button" variant="ghost" size="sm" className="flex-1"
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Copy challenge link to clipboard"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {isSharing ? 'Sharing…' : copied ? 'Copied!' : 'Share'}
          </Button>
          <Button
            type="button" variant="ghost" size="sm" className="flex-1"
            onClick={() => setShowExplanation((v) => !v)}
            aria-expanded={showExplanation}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', showExplanation && 'rotate-180')}
              aria-hidden="true"
            />
            Explanation
          </Button>
        </div>

        {/* Explanation panel */}
        {showExplanation && (
          <div className="mt-4 rounded-lg border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)] p-4 text-left">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Slot breakdown</h3>
            <div className="space-y-2">
              {result.slotResults.map((slot) => {
                const submittedLabel = slot.submitted
                  ? (componentBySlug.get(slot.submitted)?.label ?? slot.submitted)
                  : null;
                const expectedLabel = componentBySlug.get(slot.expected)?.label ?? slot.expected;
                return (
                  <div
                    key={slot.slotId}
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3 text-xs',
                      slot.correct
                        ? 'bg-[var(--slot-correct)]/10'
                        : 'bg-[var(--slot-incorrect)]/10',
                    )}
                  >
                    {slot.correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--slot-correct)]" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--slot-incorrect)]" aria-hidden="true" />
                    )}
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {slot.correct
                          ? `Great job using ${expectedLabel} here`
                          : `Expected: ${expectedLabel}`}
                      </div>
                      {!slot.correct && submittedLabel && (
                        <div className="mt-0.5 text-[var(--text-secondary)]">
                          You placed: {submittedLabel}
                        </div>
                      )}
                      {!slot.correct && !submittedLabel && (
                        <div className="mt-0.5 text-[var(--text-secondary)]">Slot was left empty</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
