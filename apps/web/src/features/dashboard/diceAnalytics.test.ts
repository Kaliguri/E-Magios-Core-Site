import { describe, it, expect } from 'vitest';
import {
  asNumber,
  computeStats,
  computeDiceFromEvents,
  normalizeDiceType,
  parseSidesFromDiceType,
  normalizeDiceReport,
  resolveDiceData,
  formatPercent,
  USER_DISPLAY_NAME_BY_UID,
} from './diceAnalytics';
import type { DiceEvent } from './types';

describe('helpers', () => {
  it('asNumber falls back on non-numeric', () => {
    expect(asNumber('5')).toBe(5);
    expect(asNumber('x', 3)).toBe(3);
    expect(asNumber(undefined, 0)).toBe(0);
  });

  it('normalizeDiceType handles raw numbers and d-prefixed', () => {
    expect(normalizeDiceType('d20')).toBe('d20');
    expect(normalizeDiceType('20')).toBe('d20');
    expect(normalizeDiceType('  D12 ')).toBe('d12');
    expect(normalizeDiceType('')).toBe('');
  });

  it('parseSidesFromDiceType extracts sides', () => {
    expect(parseSidesFromDiceType('d6')).toBe(6);
    expect(parseSidesFromDiceType('d100')).toBe(100);
    expect(parseSidesFromDiceType('nope')).toBe(0);
  });

  it('formatPercent formats fraction as percent', () => {
    expect(formatPercent(0.1234)).toBe('12.34%');
    expect(formatPercent(Number.NaN)).toBe('0%');
  });
});

describe('computeStats', () => {
  it('returns null for empty values or invalid sides', () => {
    expect(computeStats([], 6)).toBeNull();
    expect(computeStats([1, 2], 0)).toBeNull();
  });

  it('computes average, theoretical, delta and crit rates', () => {
    const stats = computeStats([1, 6, 6, 3], 6);
    expect(stats).not.toBeNull();
    expect(stats?.count).toBe(4);
    expect(stats?.avg).toBe(4);
    expect(stats?.theoretical).toBe(3.5);
    expect(stats?.delta).toBe(0.5);
    expect(stats?.failRate).toBe(0.25); // one '1'
    expect(stats?.successRate).toBe(0.5); // two '6'
  });
});

describe('computeDiceFromEvents', () => {
  const events: DiceEvent[] = [
    { diceType: 'd12', sides: 12, result: 12, context: 'arcana', userId: 'u1', createdAt: 100 },
    { diceType: 'd12', sides: 12, result: 1, context: 'arcana', userId: 'u1', createdAt: 200 },
    { diceType: 'd6', sides: 6, result: 4, context: 'damage', userId: 'u2', createdAt: 150 },
  ];

  it('aggregates per dice type', () => {
    const result = computeDiceFromEvents(events);
    expect(result.status).toBe('ok');
    expect(result.rollsCountByDiceType['d12']).toBe(2);
    expect(result.rollsCountByDiceType['d6']).toBe(1);
    expect(result.avgResultByDiceType['d12']).toBe(6.5);
    expect(result.critFailRate['d12']).toBe(0.5);
    expect(result.critSuccessRate['d12']).toBe(0.5);
  });

  it('builds roll-type labels for core d12 contexts', () => {
    const result = computeDiceFromEvents(events);
    const arcana = result.rollTypeStats.find((r) => r.context === 'arcana');
    expect(arcana).toBeDefined();
    expect(arcana?.label).toBe('D12 - Аркана - (1d12)');
    expect(arcana?.count).toBe(2);
  });

  it('produces per-user summaries sorted by roll count', () => {
    const result = computeDiceFromEvents(events);
    expect(result.userSummaries[0].userId).toBe('u1');
    expect(result.userSummaries[0].rollsCount).toBe(2);
  });

  it('picks the most frequent roll as topRollType', () => {
    const result = computeDiceFromEvents(events);
    expect(result.topRollType?.count).toBe(2);
    expect(result.topRollType?.share).toBeCloseTo(2 / 3, 4);
  });

  it('skips malformed events and returns insufficient_data when empty', () => {
    expect(computeDiceFromEvents([]).status).toBe('insufficient_data');
    expect(computeDiceFromEvents([{ diceType: '', result: 5 }]).status).toBe('insufficient_data');
  });
});

describe('normalizeDiceReport', () => {
  it('returns empty result when report status is not ok', () => {
    expect(normalizeDiceReport({ status: 'insufficient_data' }).status).toBe('insufficient_data');
    expect(normalizeDiceReport(null).status).toBe('insufficient_data');
  });

  it('resolves known UIDs to display names in user summaries', () => {
    const uid = Object.keys(USER_DISPLAY_NAME_BY_UID)[0];
    const out = normalizeDiceReport({
      status: 'ok',
      rollsCountByDiceType: { d6: 1 },
      userSummaries: [{ userId: uid, rollsCount: 1 }],
    });
    expect(out.userSummaries[0].userDisplayName).toBe(USER_DISPLAY_NAME_BY_UID[uid]);
  });
});

describe('resolveDiceData', () => {
  it('prefers local events when present', () => {
    const { dice, usedLocal } = resolveDiceData(
      { status: 'ok', rollsCountByDiceType: { d6: 99 } },
      [{ diceType: 'd6', sides: 6, result: 3, userId: 'u1', createdAt: 1 }],
    );
    expect(usedLocal).toBe(true);
    expect(dice.rollsCountByDiceType['d6']).toBe(1);
  });

  it('falls back to the report when no local events', () => {
    const { dice, usedLocal } = resolveDiceData(
      { status: 'ok', rollsCountByDiceType: { d6: 99 }, rollTypeStats: [], userSummaries: [] },
      [],
    );
    expect(usedLocal).toBe(false);
    expect(dice.rollsCountByDiceType['d6']).toBe(99);
  });
});
