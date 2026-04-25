import { scoreSubmission } from '../score';

describe('scoreSubmission', () => {
  const answer = {
    'slot-1': 'cdn',
    'slot-2': 'load-balancer',
    'slot-3': 'cache',
    'slot-4': 'database',
  };

  it('returns 100 and passed=true when all correct', () => {
    const result = scoreSubmission({ ...answer }, answer);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('returns 0 and passed=false when all wrong', () => {
    const wrong = {
      'slot-1': 'database',
      'slot-2': 'cdn',
      'slot-3': 'load-balancer',
      'slot-4': 'cache',
    };
    const result = scoreSubmission(wrong, answer);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('returns correct partial score', () => {
    const partial = {
      'slot-1': 'cdn',
      'slot-2': 'wrong',
      'slot-3': 'cache',
      'slot-4': 'wrong',
    };
    const result = scoreSubmission(partial, answer);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });

  it('returns 75 for 3/4 correct', () => {
    const partial = { ...answer, 'slot-4': 'wrong' };
    const result = scoreSubmission(partial, answer);
    expect(result.score).toBe(75);
  });

  it('handles empty submission — all slots null', () => {
    const result = scoreSubmission({}, answer);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    result.slotResults.forEach((r) => {
      expect(r.submitted).toBeNull();
      expect(r.correct).toBe(false);
    });
  });

  it('handles empty answer — returns 100 with no slot results', () => {
    const result = scoreSubmission({}, {});
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.slotResults).toHaveLength(0);
  });

  it('ignores extra keys in submission not in answer', () => {
    const extraKeys = { ...answer, 'slot-99': 'extra-component' };
    const result = scoreSubmission(extraKeys, answer);
    expect(result.score).toBe(100);
    expect(result.slotResults).toHaveLength(4);
  });

  it('populates slotResults correctly', () => {
    const submission = {
      'slot-1': 'cdn',
      'slot-2': 'wrong',
    };
    const simpleAnswer = { 'slot-1': 'cdn', 'slot-2': 'load-balancer' };
    const result = scoreSubmission(submission, simpleAnswer);

    const slot1 = result.slotResults.find((r) => r.slotId === 'slot-1');
    const slot2 = result.slotResults.find((r) => r.slotId === 'slot-2');

    expect(slot1?.correct).toBe(true);
    expect(slot1?.submitted).toBe('cdn');
    expect(slot1?.expected).toBe('cdn');

    expect(slot2?.correct).toBe(false);
    expect(slot2?.submitted).toBe('wrong');
    expect(slot2?.expected).toBe('load-balancer');
  });

  it('rounds score to nearest integer', () => {
    const threeSlot = { 's1': 'a', 's2': 'b', 's3': 'c' };
    const submission = { 's1': 'a' };
    const result = scoreSubmission(submission, threeSlot);
    expect(Number.isInteger(result.score)).toBe(true);
    expect(result.score).toBe(33);
  });

  it('all slotResults have correct shape', () => {
    const result = scoreSubmission({ ...answer }, answer);
    result.slotResults.forEach((r) => {
      expect(r).toHaveProperty('slotId');
      expect(r).toHaveProperty('correct');
      expect(r).toHaveProperty('submitted');
      expect(r).toHaveProperty('expected');
    });
  });
});
