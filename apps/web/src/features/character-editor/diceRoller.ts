// Dice roller that records events in the same localStorage shape the legacy
// site used (`diceRollEventsLegacy`), so the dashboard's local-events path
// reports rolls made from the React editor. Mirrors common.js event fields.

export const DICE_EVENTS_STORAGE_KEY = 'diceRollEventsLegacy';
const DICE_EVENTS_SESSION_KEY = 'diceEventsSessionId';
const DICE_EVENTS_MAX = 5000;

/** Roll context categories understood by the dashboard analytics. */
export type RollContext = 'arcana' | 'hit' | 'apply' | 'damage' | 'custom' | 'other';

export interface DiceRollResult {
  diceType: string;
  sides: number;
  count: number;
  modifier: number;
  rolls: number[];
  total: number;
  context: RollContext;
  expression: string;
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  try {
    const saved = sessionStorage.getItem(DICE_EVENTS_SESSION_KEY);
    if (saved) return saved;
    const next = makeId('session');
    sessionStorage.setItem(DICE_EVENTS_SESSION_KEY, next);
    return next;
  } catch {
    return makeId('session');
  }
}

function rollOne(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rolls `count`d`sides` + `modifier`. Pure aside from RNG — pass a fixed
 * `rng`-free seed is not supported, but callers can inspect `rolls`.
 */
export function rollDice(
  sides: number,
  count = 1,
  modifier = 0,
  context: RollContext = 'other',
): DiceRollResult {
  const safeSides = Math.max(2, Math.trunc(sides));
  const safeCount = Math.max(1, Math.trunc(count));
  const rolls: number[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    rolls.push(rollOne(safeSides));
  }
  const sum = rolls.reduce((acc, r) => acc + r, 0);
  const modPart = modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : '';
  return {
    diceType: `d${safeSides}`,
    sides: safeSides,
    count: safeCount,
    modifier,
    rolls,
    total: sum + modifier,
    context,
    expression: `${safeCount}d${safeSides}${modPart}`,
  };
}

interface PersistOptions {
  uid: string | null;
  characterId: string | null;
}

/**
 * Appends one event per individual die to localStorage, matching the legacy
 * `buildDiceEventsFromEntry` output so the dashboard can aggregate them.
 */
export function recordDiceRoll(roll: DiceRollResult, { uid, characterId }: PersistOptions): void {
  try {
    const raw = localStorage.getItem(DICE_EVENTS_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
    const events = Array.isArray(existing) ? existing : [];
    const createdAt = Date.now();
    const sessionId = getSessionId();
    roll.rolls.forEach((result) => {
      events.push({
        eventId: makeId('event'),
        userId: uid || 'anonymous',
        characterId: characterId ?? null,
        diceType: roll.diceType,
        sides: roll.sides,
        result,
        modifier: roll.modifier,
        total: roll.total,
        context: roll.context,
        expression: roll.expression,
        sessionId,
        createdAt,
        appVersion: 'react-app',
      });
    });
    localStorage.setItem(DICE_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-DICE_EVENTS_MAX)));
  } catch {
    // recording is best-effort; never block the UI on it
  }
}
