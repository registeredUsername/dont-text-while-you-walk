import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/rng';

describe('Rng', () => {
  it('donne la même suite pour la même graine', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('donne des suites différentes pour des graines différentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('reste dans les bornes', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(0, 2);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(2);
      const r = rng.range(5, 6);
      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(6);
    }
  });

  it('respecte les poids', () => {
    const rng = new Rng(3);
    let heavy = 0;
    for (let i = 0; i < 1000; i++)
      if (rng.weighted(['a', 'b'], (x) => (x === 'a' ? 9 : 1)) === 'a') heavy++;
    expect(heavy).toBeGreaterThan(800);
  });
});
