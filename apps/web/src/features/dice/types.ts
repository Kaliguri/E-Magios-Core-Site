import type { RolledPart } from './rollExpression';
import type { BonusBreakdown, RollType } from './characterRollBonus';

export interface DiceHistoryEntry {
  id: string;
  /** The expression actually rolled (may include an auto-applied character bonus). */
  expression: string;
  /** The original expression before the character bonus was appended, if any. */
  displayExpression?: string;
  total: number;
  parts: RolledPart[];
  createdAt: number;
  label?: string | null;
  rollType?: RollType | null;
  characterName?: string | null;
  spellId?: string | null;
  isCrit?: boolean;
  isCritFail?: boolean;
  bonus?: BonusBreakdown | null;
}

export interface RollRequest {
  /** Raw expression, with or without a leading `/roll`. */
  expression: string;
  rollType?: RollType | null;
  label?: string | null;
  /** Force a specific character (e.g. the open sheet); falls back to the selected one. */
  characterId?: string | null;
  spellId?: string | null;
  /** Defaults to true — set false to roll the literal expression with no character bonus. */
  applyCharacterBonus?: boolean;
}
