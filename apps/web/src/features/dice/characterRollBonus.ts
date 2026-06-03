import type { Character } from '@/entities/character/types';
import { calculateStats } from '@/features/character-editor/characterCalculations';

export type RollType = 'arcana' | 'hit' | 'apply';

export interface BonusItem {
  label: string;
  value: number;
}

export interface BonusBreakdown {
  rollType: RollType;
  total: number;
  items: BonusItem[];
}

export const ROLL_TYPE_LABELS: Record<RollType, string> = {
  arcana: 'Аркана',
  hit: 'Попадание',
  apply: 'Наложение',
};

/**
 * Per-roll-type bonus a character contributes to a d12 roll. Arcana is the base
 * for all three; Hit/Apply add the level's attack/effect bonus. Temporary
 * bonuses from the "Бонусы" tab apply to every roll (the legacy widget grouped
 * them by stat; the React model keeps them generic, so they apply broadly).
 */
export function buildCharacterBonus(character: Character, rollType: RollType): BonusBreakdown {
  const stats = character.stats ?? calculateStats(character.level);
  const items: BonusItem[] = [{ label: 'Аркана', value: stats.arcana }];

  if (rollType === 'hit') {
    items.push({ label: 'Бонус к Попаданию', value: stats.hitBonus });
  } else if (rollType === 'apply') {
    items.push({ label: 'Бонус к Наложению', value: stats.effectBonus });
  }

  for (const bonus of character.temporaryBonuses ?? []) {
    if (bonus.value) {
      items.push({ label: bonus.name?.trim() || 'Бонус', value: bonus.value });
    }
  }

  const total = items.reduce((acc, item) => acc + item.value, 0);
  return { rollType, total, items };
}
