import { seededShuffle } from '../shuffle';

describe('seededShuffle', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];

  it('returns same length array', () => {
    expect(seededShuffle(arr, 'test-seed')).toHaveLength(arr.length);
  });

  it('is deterministic — same seed produces same order', () => {
    const a = seededShuffle(arr, 'my-seed');
    const b = seededShuffle(arr, 'my-seed');
    expect(a).toEqual(b);
  });

  it('different seeds produce different orders', () => {
    const a = seededShuffle(arr, 'seed-a');
    const b = seededShuffle(arr, 'seed-b');
    expect(a).not.toEqual(b);
  });

  it('does not mutate the original array', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    seededShuffle(original, 'seed');
    expect(original).toEqual(copy);
  });

  it('contains all original elements', () => {
    const result = seededShuffle(arr, 'check-elements');
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('handles empty array', () => {
    expect(seededShuffle([], 'seed')).toEqual([]);
  });

  it('handles single element array', () => {
    expect(seededShuffle([42], 'seed')).toEqual([42]);
  });

  it('handles string arrays', () => {
    const strings = ['a', 'b', 'c', 'd'];
    const result = seededShuffle(strings, 'seed');
    expect(result).toHaveLength(4);
    expect(result.sort()).toEqual([...strings].sort());
  });
});
