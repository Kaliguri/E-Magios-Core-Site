import { describe, it, expect, beforeEach } from 'vitest';
import { rollDice, recordDiceRoll, DICE_EVENTS_STORAGE_KEY } from './diceRoller';

describe('rollDice', () => {
  it('produces results within bounds and a consistent total', () => {
    for (let i = 0; i < 200; i += 1) {
      const roll = rollDice(12, 1, 0, 'arcana');
      expect(roll.diceType).toBe('d12');
      expect(roll.sides).toBe(12);
      expect(roll.rolls).toHaveLength(1);
      expect(roll.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(roll.rolls[0]).toBeLessThanOrEqual(12);
      expect(roll.total).toBe(roll.rolls[0]);
    }
  });

  it('applies count and modifier in total and expression', () => {
    const roll = rollDice(6, 3, 2, 'damage');
    expect(roll.rolls).toHaveLength(3);
    expect(roll.expression).toBe('3d6+2');
    const sum = roll.rolls.reduce((a, b) => a + b, 0);
    expect(roll.total).toBe(sum + 2);
  });

  it('clamps invalid sides/count up to safe minimums', () => {
    const roll = rollDice(0, 0);
    expect(roll.sides).toBe(2);
    expect(roll.count).toBe(1);
  });
});

describe('recordDiceRoll', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends one legacy-shaped event per die', () => {
    const roll = rollDice(6, 2, 0, 'damage');
    recordDiceRoll(roll, { uid: 'u1', characterId: 'c1' });
    const stored = JSON.parse(localStorage.getItem(DICE_EVENTS_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0]).toMatchObject({
      userId: 'u1',
      characterId: 'c1',
      diceType: 'd6',
      sides: 6,
      context: 'damage',
      appVersion: 'react-app',
    });
    expect(typeof stored[0].eventId).toBe('string');
    expect(typeof stored[0].createdAt).toBe('number');
  });

  it('uses anonymous when no uid is given and accumulates across rolls', () => {
    recordDiceRoll(rollDice(12, 1, 0, 'arcana'), { uid: null, characterId: null });
    recordDiceRoll(rollDice(20, 1, 0, 'other'), { uid: null, characterId: null });
    const stored = JSON.parse(localStorage.getItem(DICE_EVENTS_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0].userId).toBe('anonymous');
  });
});
