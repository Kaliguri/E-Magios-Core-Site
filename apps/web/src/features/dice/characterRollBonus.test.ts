import { describe, it, expect } from 'vitest';
import { buildCharacterBonus } from './characterRollBonus';
import { calculateStats } from '@/features/character-editor/characterCalculations';
import type { Character } from '@/entities/character/types';

function makeCharacter(level: number, temp: { name: string; value: number }[] = []): Character {
  return {
    id: 'c1',
    name: 'Тест',
    level,
    stats: calculateStats(level),
    magicSkills: [],
    personalitySkills: [],
    studySpells: [],
    signatureSpells: [],
    spontaneousSpells: [],
    schools: [],
    archetypes: [],
    temporaryBonuses: temp.map((t, i) => ({ id: String(i), name: t.name, value: t.value })),
  };
}

describe('buildCharacterBonus', () => {
  it('uses arcana as the base for an arcana roll', () => {
    const character = makeCharacter(5); // arcana 3
    const bonus = buildCharacterBonus(character, 'arcana');
    expect(bonus.total).toBe(3);
    expect(bonus.items).toEqual([{ label: 'Аркана', value: 3 }]);
  });

  it('adds the hit bonus for a hit roll', () => {
    const character = makeCharacter(5); // arcana 3, hitBonus 3
    const bonus = buildCharacterBonus(character, 'hit');
    expect(bonus.total).toBe(6);
  });

  it('adds the effect bonus for an apply roll', () => {
    const character = makeCharacter(5); // arcana 3, effectBonus 3
    const bonus = buildCharacterBonus(character, 'apply');
    expect(bonus.total).toBe(6);
  });

  it('includes temporary bonuses on every roll type', () => {
    const character = makeCharacter(5, [{ name: 'Благословение', value: 2 }]);
    const bonus = buildCharacterBonus(character, 'arcana');
    expect(bonus.total).toBe(5); // arcana 3 + 2
    expect(bonus.items[bonus.items.length - 1]).toEqual({ label: 'Благословение', value: 2 });
  });
});
