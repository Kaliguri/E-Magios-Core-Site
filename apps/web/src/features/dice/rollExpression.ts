// Pure dice-expression parser + roller, ported from the legacy global dice
// widget (`common.js`). Supports `/roll`-style expressions like `2d4+3d6-1`,
// `1d12*2/3`, `+5`. RNG is injectable so the roller can be unit-tested.

export type ScaleOp = '*' | '/';

export type RollSegment =
  | {
      kind: 'dice';
      sign: 1 | -1;
      count: number;
      sides: number;
      scaleOp: ScaleOp | null;
      scale: number | null;
    }
  | { kind: 'number'; sign: 1 | -1; value: number };

export interface ParsedRoll {
  expression: string;
  segments: RollSegment[];
}

export interface RolledDicePart {
  kind: 'dice';
  sign: 1 | -1;
  count: number;
  sides: number;
  rolls: number[];
  baseSum: number;
  scaleOp: ScaleOp | null;
  scale: number | null;
  segmentTotal: number;
}

export interface RolledNumberPart {
  kind: 'number';
  sign: 1 | -1;
  value: number;
}

export type RolledPart = RolledDicePart | RolledNumberPart;

export interface RollResult {
  expression: string;
  total: number;
  parts: RolledPart[];
  createdAt: number;
}

const ALLOWED_SIDES = [2, 4, 6, 8, 10, 12, 20, 100];

export function parseRollExpression(raw: string): ParsedRoll {
  const trimmed = raw.trim();
  const withoutCommand = trimmed.toLowerCase().startsWith('/roll')
    ? trimmed.slice(5).trim()
    : trimmed;

  if (!withoutCommand) {
    throw new Error('Пустая команда броска.');
  }

  const normalized = withoutCommand.replace(/\s+/g, '');

  if (!/^[0-9dD+\-*/]+$/.test(normalized)) {
    throw new Error('Допускаются только цифры, d, +, -, * и /. Пример: /roll 2d4*2+3d6-1');
  }

  const segments: { sign: 1 | -1; text: string }[] = [];
  let current = '';
  let currentSign: 1 | -1 = 1;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === '+' || ch === '-') {
      if (i === 0) {
        currentSign = ch === '+' ? 1 : -1;
        continue;
      }
      if (!current) {
        throw new Error('Выражение не должно содержать два знака подряд. Пример: 2d4+3d6-1');
      }
      segments.push({ sign: currentSign, text: current });
      current = '';
      currentSign = ch === '+' ? 1 : -1;
    } else {
      current += ch;
    }
  }

  if (!current) {
    throw new Error('Выражение не должно заканчиваться знаком + или -.');
  }
  segments.push({ sign: currentSign, text: current });

  const parsedSegments: RollSegment[] = segments.map((seg) => {
    const text = seg.text;
    if (/[dD]/.test(text)) {
      const m = text.match(/^(\d*)[dD](\d+)(?:([*/])(\d+))?$/);
      if (!m) {
        throw new Error('Неверный формат кубов. Пример: 2d4*2+3d6-1');
      }
      const count = m[1] ? parseInt(m[1], 10) : 1;
      const sides = parseInt(m[2], 10);
      const scaleOp = (m[3] as ScaleOp) || null;
      const scale = m[4] ? parseInt(m[4], 10) : null;

      if (!Number.isFinite(count) || count <= 0 || count > 100) {
        throw new Error('Количество кубов должно быть от 1 до 100.');
      }
      if (!ALLOWED_SIDES.includes(sides)) {
        throw new Error('Разрешены только D2, D4, D6, D8, D10, D12, D20 и D100.');
      }
      if (
        scaleOp &&
        (!Number.isFinite(scale as number) || (scale as number) <= 0 || (scale as number) > 1000)
      ) {
        throw new Error('Множитель/делитель должен быть положительным числом (1–1000).');
      }

      return { kind: 'dice', sign: seg.sign, count, sides, scaleOp, scale };
    }

    if (!/^\d+$/.test(text)) {
      throw new Error('Неверный числовой модификатор. Пример: +5 или -10');
    }
    const value = parseInt(text, 10);
    if (!Number.isFinite(value) || value < 0 || value > 100000) {
      throw new Error('Численный бонус/штраф должен быть в разумных пределах (0–100000).');
    }
    return { kind: 'number', sign: seg.sign, value };
  });

  return { expression: normalized, segments: parsedSegments };
}

export function rollExpression(parsed: ParsedRoll, rng: () => number = Math.random): RollResult {
  const parts: RolledPart[] = [];
  let total = 0;

  parsed.segments.forEach((seg) => {
    if (seg.kind === 'dice') {
      const rolls: number[] = [];
      let baseSum = 0;
      for (let i = 0; i < seg.count; i += 1) {
        const value = 1 + Math.floor(rng() * seg.sides);
        rolls.push(value);
        baseSum += value;
      }

      let segmentTotal = baseSum;
      if (seg.scaleOp && seg.scale) {
        segmentTotal = seg.scaleOp === '*' ? baseSum * seg.scale : baseSum / seg.scale;
      }

      total += seg.sign * segmentTotal;
      parts.push({
        kind: 'dice',
        sign: seg.sign,
        count: seg.count,
        sides: seg.sides,
        rolls,
        baseSum,
        scaleOp: seg.scaleOp,
        scale: seg.scale,
        segmentTotal,
      });
    } else {
      total += seg.sign * seg.value;
      parts.push({ kind: 'number', sign: seg.sign, value: seg.value });
    }
  });

  return { expression: parsed.expression, total, parts, createdAt: Date.now() };
}

export function rollFromString(raw: string, rng?: () => number): RollResult {
  return rollExpression(parseRollExpression(raw), rng);
}

/**
 * A single d12 rolling a natural 12 is a critical success (Arcana / Hit rolls).
 * Apply (effect) rolls don't crit — callers pass `isApply` to suppress it.
 */
export function isCriticalRoll(result: RollResult, isApply = false): boolean {
  if (isApply) return false;
  return result.parts.some(
    (part) =>
      part.kind === 'dice' && part.sides === 12 && part.count === 1 && part.rolls.includes(12),
  );
}

/** A single d12 rolling a natural 1 is a critical failure. */
export function isCriticalFail(result: RollResult): boolean {
  return result.parts.some(
    (part) =>
      part.kind === 'dice' && part.sides === 12 && part.count === 1 && part.rolls.includes(1),
  );
}
