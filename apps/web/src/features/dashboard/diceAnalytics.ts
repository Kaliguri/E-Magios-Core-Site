// 1:1 port of the dice-analytics logic from the legacy dashboard.js.
// Pure functions only — UI lives in pages/dashboard. Kept faithful so the
// React dashboard reports the same numbers as the legacy page on the same data.
import type { DiceEvent, DiceResult, RollTypeStat, UserTypeStat } from './types';

export const DICE_EVENTS_STORAGE_KEY = 'diceRollEventsLegacy';
export const SUPPORTED_DICE = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

// Hard-coded UID→name map carried over from the legacy dashboard.
export const USER_DISPLAY_NAME_BY_UID: Record<string, string> = {
  '4BzLAuul5UOkokZiXkvMajzDkgq2': 'xGaida',
  NgY5bTPvLohTQZsakTLTSozYbWo1: 'Vakineti',
  fgvej6iwakMQE7hx9rxKpBecxLc2: 'Foxl',
  hYxVKqLCrSUSyut88VXC1XvBt7t1: 'Shieldomirs',
};

const ANONYMOUS = 'анонимный';
const UNKNOWN = 'не указан';
const NO_LOCAL_REASON = 'Локальные события бросков не найдены.';
const NO_DATA = 'Нет данных';

export function asNumber(value: unknown, fallback = 0): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(2)}%`;
}

export function formatDateTime(timestamp: unknown): string {
  const date = new Date(asNumber(timestamp, 0));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('ru-RU');
}

export function normalizeDiceType(value: unknown): string {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('d')) {
    return raw;
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `d${Math.trunc(numeric)}`;
  }
  return raw;
}

export function parseSidesFromDiceType(diceType: unknown): number {
  const match = String(diceType || '').match(/^d(\d+)$/i);
  if (!match) {
    return 0;
  }
  return Math.trunc(asNumber(match[1], 0));
}

function normalizeRollExpression(expression: unknown): string {
  return String(expression || '')
    .toLowerCase()
    .replace(/^\/roll\s+/i, '')
    .replace(/\s+/g, '');
}

function extractPrimaryDiceExpression(expression: unknown, diceType: string): string {
  const normalized = normalizeRollExpression(expression);
  const match = normalized.match(/(\d+d\d+)/i);
  if (match) {
    return String(match[1]).toLowerCase();
  }
  if (diceType && /^d\d+$/i.test(diceType)) {
    return `1${String(diceType).toLowerCase()}`;
  }
  return normalized || String(diceType || '').toLowerCase();
}

function normalizeRollContext(event: DiceEvent): string {
  const direct = String(event.context || '')
    .trim()
    .toLowerCase();
  if (direct) {
    return direct;
  }
  const rollType = String(event.contextRollType || '')
    .trim()
    .toLowerCase();
  if (rollType) {
    return rollType;
  }
  const source = String(event.contextSource || '')
    .trim()
    .toLowerCase();
  if (source.includes('arcana')) {
    return 'arcana';
  }
  if (source.includes('hit')) {
    return 'hit';
  }
  if (source.includes('apply')) {
    return 'apply';
  }
  return 'other';
}

interface RollSignature {
  rollTypeKey: string;
  category: string;
  label: string;
  expression: string;
}

function buildRollTypeSignature(
  context: string,
  diceType: unknown,
  expression: unknown,
): RollSignature {
  const normalizedDiceType = normalizeDiceType(diceType);
  const primaryExpression = extractPrimaryDiceExpression(expression, normalizedDiceType);
  const isCustom = String(context || '').startsWith('custom');
  if (isCustom) {
    const customExpression =
      normalizeRollExpression(expression) || primaryExpression || normalizedDiceType;
    return {
      rollTypeKey: `custom:${customExpression}`,
      category: 'custom',
      label: `Кастомный - (${customExpression})`,
      expression: customExpression,
    };
  }

  const isCoreD12 =
    normalizedDiceType === 'd12' && ['arcana', 'hit', 'apply'].includes(String(context || ''));
  const categoryMap: Record<string, string> = {
    arcana: 'Аркана',
    hit: 'Попадание',
    apply: 'Наложение эффекта',
  };
  const category = isCoreD12 ? String(context) : 'damage';
  const categoryLabel = isCoreD12 ? categoryMap[category] : 'Урон';
  const cleanedExpression = isCoreD12 ? '1d12' : primaryExpression;
  const diceLabel = normalizedDiceType ? normalizedDiceType.toUpperCase() : 'D?';
  return {
    rollTypeKey: `${category}:${normalizedDiceType}:${cleanedExpression}`,
    category,
    label: `${diceLabel} - ${categoryLabel} - (${cleanedExpression})`,
    expression: cleanedExpression,
  };
}

function resolveUserDisplayName(
  userId: string,
  row: { userDisplayName?: string; userLabel?: string },
): string {
  const fromRow = String(row.userDisplayName || row.userLabel || '').trim();
  if (fromRow) {
    return fromRow;
  }
  if (USER_DISPLAY_NAME_BY_UID[userId]) {
    return USER_DISPLAY_NAME_BY_UID[userId];
  }
  return userId || ANONYMOUS;
}

export function loadLocalDiceEvents(): DiceEvent[] {
  try {
    const raw = localStorage.getItem(DICE_EVENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiceEvent[]) : [];
  } catch {
    return [];
  }
}

interface BasicStats {
  count: number;
  avg: number;
  theoretical: number;
  delta: number;
  failRate: number;
  successRate: number;
}

export function computeStats(values: number[], sides: number): BasicStats | null {
  if (!values.length || sides <= 0) {
    return null;
  }
  const sum = values.reduce((acc, item) => acc + item, 0);
  const avg = sum / values.length;
  const theoretical = (sides + 1) / 2;
  const fails = values.filter((item) => item === 1).length;
  const success = values.filter((item) => item === sides).length;
  return {
    count: values.length,
    avg: Number(avg.toFixed(4)),
    theoretical: Number(theoretical.toFixed(4)),
    delta: Number((avg - theoretical).toFixed(4)),
    failRate: Number((fails / values.length).toFixed(4)),
    successRate: Number((success / values.length).toFixed(4)),
  };
}

export function buildEmptyDiceResult(reason: string): DiceResult {
  return {
    status: 'insufficient_data',
    reason,
    rollsCountByDiceType: {},
    avgResultByDiceType: {},
    theoreticalAvgByDiceType: {},
    avgDeltaFromTheoretical: {},
    critFailRate: {},
    critSuccessRate: {},
    userAvgVsGlobal: [],
    userSummaries: [],
    userTypeStats: [],
    rollTypeStats: [],
    topRollType: null,
  };
}

export function computeDiceFromEvents(events: DiceEvent[]): DiceResult {
  const groups: Record<string, { values: number[]; sides: number }> = {};
  const userGroups: Record<
    string,
    { userId: string; userDisplayName: string; diceType: string; values: number[] }
  > = {};
  const rollGroups: Record<
    string,
    {
      rollTypeKey: string;
      context: string;
      label: string;
      diceType: string;
      expression: string;
      values: number[];
      sides: number;
    }
  > = {};
  const userSummariesMap: Record<
    string,
    {
      userId: string;
      userDisplayName: string;
      rollsCount: number;
      resultSum: number;
      deltaSum: number;
      critFailCount: number;
      critSuccessCount: number;
      lastRollAt: number;
    }
  > = {};
  const userTypeGroups: Record<
    string,
    {
      userId: string;
      userDisplayName: string;
      rollTypeKey: string;
      label: string;
      context: string;
      diceType: string;
      expression: string;
      sides: number;
      values: number[];
      lastRollAt: number;
    }
  > = {};

  events.forEach((event) => {
    if (!event || typeof event !== 'object') {
      return;
    }
    const diceType = normalizeDiceType(event.diceType);
    const sides = Math.trunc(asNumber(event.sides, parseSidesFromDiceType(diceType)));
    const result = Math.trunc(asNumber(event.result, NaN));
    const userId = String(event.userId || ANONYMOUS);
    const createdAt = Math.trunc(asNumber(event.createdAt, 0));
    const context = normalizeRollContext(event);
    const expression = String(event.expression || event.displayExpression || diceType || '').trim();
    const rollSignature = buildRollTypeSignature(context, diceType, expression);
    const rollTypeKey = String(rollSignature.rollTypeKey || `${context}:${diceType}`)
      .trim()
      .toLowerCase();
    const userDisplayName = resolveUserDisplayName(userId, event);

    if (!diceType || !Number.isFinite(result) || !Number.isFinite(sides) || sides <= 0) {
      return;
    }

    if (!groups[diceType]) {
      groups[diceType] = { values: [], sides };
    }
    groups[diceType].values.push(result);

    const userKey = `${userId}::${diceType}`;
    if (!userGroups[userKey]) {
      userGroups[userKey] = { userId, userDisplayName, diceType, values: [] };
    }
    userGroups[userKey].values.push(result);

    if (!rollGroups[rollTypeKey]) {
      rollGroups[rollTypeKey] = {
        rollTypeKey,
        context: rollSignature.category,
        label: rollSignature.label,
        diceType,
        expression: rollSignature.expression || extractPrimaryDiceExpression(expression, diceType),
        values: [],
        sides,
      };
    }
    rollGroups[rollTypeKey].values.push(result);

    const userTypeKey = `${userId}::${rollTypeKey}`;
    if (!userTypeGroups[userTypeKey]) {
      userTypeGroups[userTypeKey] = {
        userId,
        userDisplayName,
        rollTypeKey,
        label: rollSignature.label,
        context: rollSignature.category,
        diceType,
        expression: rollSignature.expression || extractPrimaryDiceExpression(expression, diceType),
        sides,
        values: [],
        lastRollAt: createdAt,
      };
    }
    const userTypePack = userTypeGroups[userTypeKey];
    userTypePack.values.push(result);
    if (createdAt > userTypePack.lastRollAt) {
      userTypePack.lastRollAt = createdAt;
    }

    if (!userSummariesMap[userId]) {
      userSummariesMap[userId] = {
        userId,
        userDisplayName,
        rollsCount: 0,
        resultSum: 0,
        deltaSum: 0,
        critFailCount: 0,
        critSuccessCount: 0,
        lastRollAt: createdAt,
      };
    }
    const theoretical = (sides + 1) / 2;
    const pack = userSummariesMap[userId];
    pack.userDisplayName = userDisplayName;
    pack.rollsCount += 1;
    pack.resultSum += result;
    pack.deltaSum += result - theoretical;
    if (result === 1) {
      pack.critFailCount += 1;
    }
    if (result === sides) {
      pack.critSuccessCount += 1;
    }
    if (createdAt > pack.lastRollAt) {
      pack.lastRollAt = createdAt;
    }
  });

  const rollsCountByDiceType: Record<string, number> = {};
  const avgResultByDiceType: Record<string, number> = {};
  const theoreticalAvgByDiceType: Record<string, number> = {};
  const avgDeltaFromTheoretical: Record<string, number> = {};
  const critFailRate: Record<string, number> = {};
  const critSuccessRate: Record<string, number> = {};
  const userAvgVsGlobal: DiceResult['userAvgVsGlobal'] = [];
  const userTypeStats: UserTypeStat[] = [];
  const rollTypeStats: RollTypeStat[] = [];

  Object.keys(groups).forEach((diceType) => {
    const pack = groups[diceType];
    const stats = computeStats(pack.values, pack.sides);
    if (!stats) {
      return;
    }
    rollsCountByDiceType[diceType] = stats.count;
    avgResultByDiceType[diceType] = stats.avg;
    theoreticalAvgByDiceType[diceType] = stats.theoretical;
    avgDeltaFromTheoretical[diceType] = stats.delta;
    critFailRate[diceType] = stats.failRate;
    critSuccessRate[diceType] = stats.successRate;
  });

  Object.keys(userGroups).forEach((key) => {
    const pack = userGroups[key];
    const values = pack.values;
    if (!values.length || !avgResultByDiceType[pack.diceType]) {
      return;
    }
    const userAvg = values.reduce((acc, item) => acc + item, 0) / values.length;
    const globalAvg = avgResultByDiceType[pack.diceType];
    userAvgVsGlobal.push({
      userId: pack.userId,
      userDisplayName: pack.userDisplayName,
      diceType: pack.diceType,
      userAvg: Number(userAvg.toFixed(4)),
      globalAvg: Number(globalAvg.toFixed(4)),
      delta: Number((userAvg - globalAvg).toFixed(4)),
      rollsCount: values.length,
    });
  });

  Object.keys(rollGroups).forEach((rollTypeKey) => {
    const pack = rollGroups[rollTypeKey];
    const stats = computeStats(pack.values, pack.sides);
    if (!stats) {
      return;
    }
    rollTypeStats.push({
      rollTypeKey,
      context: pack.context,
      diceType: pack.diceType,
      expression: pack.expression,
      label:
        pack.label || buildRollTypeSignature(pack.context, pack.diceType, pack.expression).label,
      count: stats.count,
      avg: stats.avg,
      theoreticalAvg: stats.theoretical,
      delta: stats.delta,
      critFailRate: stats.failRate,
      critSuccessRate: stats.successRate,
    });
  });

  Object.keys(userTypeGroups).forEach((userTypeKey) => {
    const pack = userTypeGroups[userTypeKey];
    const stats = computeStats(pack.values, pack.sides);
    if (!stats) {
      return;
    }
    userTypeStats.push({
      userId: pack.userId,
      userDisplayName: pack.userDisplayName,
      rollTypeKey: pack.rollTypeKey,
      label: pack.label,
      context: pack.context,
      diceType: pack.diceType,
      expression: pack.expression,
      count: stats.count,
      avg: stats.avg,
      theoreticalAvg: stats.theoretical,
      delta: stats.delta,
      critFailCount: Math.round(stats.failRate * stats.count),
      critSuccessCount: Math.round(stats.successRate * stats.count),
      critFailRate: stats.failRate,
      critSuccessRate: stats.successRate,
      lastRollAt: pack.lastRollAt,
    });
  });

  const userSummaries = Object.values(userSummariesMap)
    .map((pack) => ({
      userId: pack.userId,
      userDisplayName: pack.userDisplayName,
      rollsCount: pack.rollsCount,
      lastRollAt: pack.lastRollAt,
      avgResult: Number((pack.resultSum / Math.max(pack.rollsCount, 1)).toFixed(4)),
      avgDeltaFromTheoretical: Number((pack.deltaSum / Math.max(pack.rollsCount, 1)).toFixed(4)),
      critFailCount: pack.critFailCount,
      critSuccessCount: pack.critSuccessCount,
      critFailRate: Number((pack.critFailCount / Math.max(pack.rollsCount, 1)).toFixed(4)),
      critSuccessRate: Number((pack.critSuccessCount / Math.max(pack.rollsCount, 1)).toFixed(4)),
    }))
    .sort((left, right) => {
      if (right.rollsCount !== left.rollsCount) {
        return right.rollsCount - left.rollsCount;
      }
      return String(left.userDisplayName).localeCompare(String(right.userDisplayName), 'ru');
    });

  rollTypeStats.sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return String(left.rollTypeKey).localeCompare(String(right.rollTypeKey), 'ru');
  });
  userTypeStats.sort((left, right) => {
    if (left.userId !== right.userId) {
      return String(left.userId).localeCompare(String(right.userId), 'ru');
    }
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return String(left.rollTypeKey).localeCompare(String(right.rollTypeKey), 'ru');
  });

  const totalRolls = Object.keys(rollsCountByDiceType).reduce(
    (acc, key) => acc + asNumber(rollsCountByDiceType[key], 0),
    0,
  );
  const topRollType = rollTypeStats.length
    ? {
        ...rollTypeStats[0],
        share: totalRolls > 0 ? Number((rollTypeStats[0].count / totalRolls).toFixed(4)) : 0,
      }
    : null;

  if (!Object.keys(rollsCountByDiceType).length) {
    return buildEmptyDiceResult(NO_LOCAL_REASON);
  }

  return {
    status: 'ok',
    reason: null,
    rollsCountByDiceType,
    avgResultByDiceType,
    theoreticalAvgByDiceType,
    avgDeltaFromTheoretical,
    critFailRate,
    critSuccessRate,
    userAvgVsGlobal,
    userSummaries,
    userTypeStats,
    rollTypeStats,
    topRollType,
  };
}

export function normalizeDiceReport(reportDice: unknown): DiceResult {
  const dice = safeObject(reportDice);
  if (String(dice['status'] || 'insufficient_data') !== 'ok') {
    return buildEmptyDiceResult(String(dice['reason'] || NO_DATA));
  }
  const normalizedUserSummaries = safeArray<{ userId?: string }>(dice['userSummaries']).map(
    (row) => {
      const userId = String(row.userId || '');
      return {
        ...row,
        userDisplayName: resolveUserDisplayName(userId, row as { userDisplayName?: string }),
      };
    },
  );
  return {
    ...(dice as unknown as DiceResult),
    rollTypeStats: safeArray<RollTypeStat>(dice['rollTypeStats']),
    userSummaries: normalizedUserSummaries as DiceResult['userSummaries'],
    userTypeStats: safeArray<UserTypeStat>(dice['userTypeStats']),
    topRollType: (dice['topRollType'] as DiceResult['topRollType']) || null,
  };
}

/**
 * Picks the dice dataset the way the legacy dashboard does: local events when
 * present, otherwise the report's precomputed dice block.
 */
export function resolveDiceData(
  reportDice: unknown,
  localEvents: DiceEvent[],
): { dice: DiceResult; usedLocal: boolean } {
  const useLocal = localEvents.length > 0;
  return {
    dice: useLocal ? computeDiceFromEvents(localEvents) : normalizeDiceReport(reportDice),
    usedLocal: useLocal,
  };
}

export const DASHBOARD_LABELS = {
  unknown: UNKNOWN,
  anonymous: ANONYMOUS,
  localSource: 'Источник: localStorage события бросков (diceRollEventsLegacy)',
  reportSource: 'Источник: reports/data_report.json',
} as const;
