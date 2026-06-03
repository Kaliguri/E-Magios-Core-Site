import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type { RollResult } from './rollExpression';

// Per-die events, in the legacy `diceRollEventsLegacy` shape the dashboard
// aggregates (see features/dashboard/diceAnalytics.ts). Recorded locally for
// everyone and, for signed-in users, mirrored to Firestore so the data report
// can include web rolls across devices/users.

export const DICE_EVENTS_STORAGE_KEY = 'diceRollEventsLegacy';
const DICE_EVENTS_SESSION_KEY = 'diceEventsSessionId';
const DICE_EVENTS_MAX = 5000;

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

export interface DiceEvent {
  eventId: string;
  userId: string;
  characterId: string | null;
  diceType: string;
  sides: number;
  result: number;
  modifier: number;
  total: number;
  context: string;
  expression: string;
  sessionId: string;
  createdAt: number;
  appVersion: string;
}

interface RecordOptions {
  uid: string | null;
  characterId?: string | null;
  context?: string;
}

/** Expand a roll into one event per individual die. */
export function buildDiceEvents(result: RollResult, options: RecordOptions): DiceEvent[] {
  const sessionId = getSessionId();
  const createdAt = result.createdAt || Date.now();
  const events: DiceEvent[] = [];
  for (const part of result.parts) {
    if (part.kind !== 'dice') continue;
    for (const value of part.rolls) {
      events.push({
        eventId: makeId('event'),
        userId: options.uid || 'anonymous',
        characterId: options.characterId ?? null,
        diceType: `d${part.sides}`,
        sides: part.sides,
        result: value,
        modifier: 0,
        total: result.total,
        context: options.context || 'other',
        expression: result.expression,
        sessionId,
        createdAt,
        appVersion: 'react-app',
      });
    }
  }
  return events;
}

export function recordDiceEventsLocal(result: RollResult, options: RecordOptions): void {
  try {
    const raw = localStorage.getItem(DICE_EVENTS_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
    const events = Array.isArray(existing) ? existing : [];
    events.push(...buildDiceEvents(result, options));
    localStorage.setItem(DICE_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-DICE_EVENTS_MAX)));
  } catch {
    // Recording is best-effort; never block the UI on it.
  }
}

/** Mirror a roll to Firestore (`users/{uid}/diceRolls`) for signed-in users. */
export async function recordDiceRollRemote(
  result: RollResult,
  options: RecordOptions & { uid: string; label?: string; rollType?: string | null },
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', options.uid, 'diceRolls'), {
      expression: result.expression,
      total: result.total,
      context: options.context || 'other',
      rollType: options.rollType ?? null,
      label: options.label ?? null,
      characterId: options.characterId ?? null,
      parts: result.parts.map((part) =>
        part.kind === 'dice'
          ? { kind: 'dice', sides: part.sides, count: part.count, rolls: part.rolls }
          : { kind: 'number', value: part.sign * part.value },
      ),
      createdAt: Timestamp.now(),
      appVersion: 'react-app',
    });
  } catch {
    // Best-effort sync — local recording already covers the dashboard.
  }
}
