import { describe, it, expect } from 'vitest';
import {
  parseRollExpression,
  rollExpression,
  rollFromString,
  isCriticalRoll,
  isCriticalFail,
} from './rollExpression';

/** Deterministic RNG cycling through the given 0..1 values. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('parseRollExpression', () => {
  it('parses a compound expression with a leading /roll', () => {
    const parsed = parseRollExpression('/roll 2d6+3');
    expect(parsed.expression).toBe('2d6+3');
    expect(parsed.segments).toEqual([
      { kind: 'dice', sign: 1, count: 2, sides: 6, scaleOp: null, scale: null },
      { kind: 'number', sign: 1, value: 3 },
    ]);
  });

  it('parses scale operators and leading signs', () => {
    const parsed = parseRollExpression('1d12*2-1');
    expect(parsed.segments[0]).toMatchObject({ kind: 'dice', sides: 12, scaleOp: '*', scale: 2 });
    expect(parsed.segments[1]).toMatchObject({ kind: 'number', sign: -1, value: 1 });
  });

  it('rejects disallowed dice sides', () => {
    expect(() => parseRollExpression('1d7')).toThrow();
  });

  it('rejects junk input', () => {
    expect(() => parseRollExpression('hello')).toThrow();
    expect(() => parseRollExpression('2d6+')).toThrow();
  });
});

describe('rollExpression', () => {
  it('is deterministic with an injected RNG', () => {
    // rng 0 -> die face 1; 0.99 -> max face
    const result = rollExpression(parseRollExpression('2d6+3'), seqRng([0, 0.99]));
    expect(result.parts[0]).toMatchObject({ kind: 'dice', rolls: [1, 6], baseSum: 7 });
    expect(result.total).toBe(10); // 1 + 6 + 3
  });

  it('applies scale to a dice segment', () => {
    const result = rollExpression(parseRollExpression('1d12*2'), seqRng([0.99]));
    expect(result.total).toBe(24);
  });

  it('subtracts negatively-signed segments', () => {
    const result = rollExpression(parseRollExpression('1d6-2'), seqRng([0.99]));
    expect(result.total).toBe(4); // 6 - 2
  });
});

describe('crit detection', () => {
  it('flags a natural 12 on a single d12 as a crit (but not on apply)', () => {
    const crit = rollFromString('1d12', seqRng([0.99]));
    expect(isCriticalRoll(crit)).toBe(true);
    expect(isCriticalRoll(crit, true)).toBe(false);
  });

  it('flags a natural 1 on a single d12 as a crit fail', () => {
    const fail = rollFromString('1d12', seqRng([0]));
    expect(isCriticalFail(fail)).toBe(true);
    expect(isCriticalRoll(fail)).toBe(false);
  });
});
