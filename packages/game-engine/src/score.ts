import type { ScoringResult, SlotResult } from '@stackdify/shared-types';

export function scoreSubmission(
  submission: Record<string, string>,
  answer: Record<string, string>,
): ScoringResult {
  const slots = Object.keys(answer);

  if (slots.length === 0) {
    return { score: 100, passed: true, slotResults: [] };
  }

  const slotResults: SlotResult[] = slots.map((id) => ({
    slotId: id,
    correct: submission[id] !== undefined && submission[id] === answer[id],
    submitted: submission[id] ?? null,
    expected: answer[id],
  }));

  const correctCount = slotResults.filter((r) => r.correct).length;

  return {
    score: Math.round((correctCount / slots.length) * 100),
    passed: correctCount === slots.length,
    slotResults,
  };
}
