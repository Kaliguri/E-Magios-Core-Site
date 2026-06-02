import { describe, it, expect } from 'vitest';
import { calculateStats, MAGIC_SKILLS, PERSONALITY_SKILLS } from './characterCalculations';

describe('calculateStats', () => {
  it('returns level-1 baseline', () => {
    const s = calculateStats(1);
    expect(s).toMatchObject({
      level: 1,
      arcana: 1,
      health: 6,
      will: 4,
      speed: 6,
      evasion: 10,
      fortitude: 10,
      actions: 2,
      reactions: 1,
    });
  });

  it('returns level-20 cap values', () => {
    const s = calculateStats(20);
    expect(s).toMatchObject({
      level: 20,
      arcana: 10,
      health: 25,
      will: 14,
      speed: 10,
      hitBonus: 11,
      effectBonus: 11,
      evasion: 25,
      fortitude: 25,
      actions: 5,
      reactions: 3,
    });
  });

  it('clamps out-of-range levels into [1, 20]', () => {
    expect(calculateStats(0).level).toBe(1);
    expect(calculateStats(-5)).toEqual(calculateStats(1));
    expect(calculateStats(99)).toEqual(calculateStats(20));
  });

  it('arcana increases monotonically with level', () => {
    let prev = 0;
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      const arcana = calculateStats(lvl).arcana;
      expect(arcana).toBeGreaterThanOrEqual(prev);
      prev = arcana;
    }
  });

  it('health grows by 1 per level from 6 at L1 to 25 at L20', () => {
    expect(calculateStats(1).health).toBe(6);
    expect(calculateStats(10).health).toBe(15);
    expect(calculateStats(20).health).toBe(25);
  });
});

describe('skill catalogs', () => {
  it('exposes six magic and six personality skills with unique ids', () => {
    expect(MAGIC_SKILLS).toHaveLength(6);
    expect(PERSONALITY_SKILLS).toHaveLength(6);
    const ids = [...MAGIC_SKILLS, ...PERSONALITY_SKILLS].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
