import type { DiceHistoryEntry } from './types';

export interface DiscordConfig {
  webhookUrl: string;
  displayName?: string | null;
  color?: string | null;
}

const WEBHOOK_RE = /^https:\/\/discord\.com\/api\/webhooks\//;
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = 0x10b981;

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/** Mirror a roll to a user's Discord webhook (configured on the profile page). */
export async function sendRollToDiscord(
  entry: DiceHistoryEntry,
  config: DiscordConfig,
): Promise<void> {
  if (!config.webhookUrl || !WEBHOOK_RE.test(config.webhookUrl)) return;

  const username = config.displayName?.trim() || "E'Magios Dice";
  let color = DEFAULT_COLOR;
  if (config.color && HEX_RE.test(config.color)) {
    color = parseInt(config.color.replace('#', ''), 16);
  }

  const title = entry.label ? `${entry.label}: ${entry.total}` : `Бросок: ${entry.total}`;
  const lines: string[] = [`Выражение: \`${entry.displayExpression || entry.expression}\``];

  const diceDetail = entry.parts
    .filter((part) => part.kind === 'dice')
    .map((part) =>
      part.kind === 'dice' ? `${part.count}d${part.sides}: [${part.rolls.join(', ')}]` : '',
    )
    .filter(Boolean)
    .join('; ');
  if (diceDetail) lines.push(diceDetail);

  if (entry.bonus && entry.bonus.items.length > 0) {
    lines.push(
      'Бонусы: ' +
        entry.bonus.items.map((item) => `${item.label} ${formatSigned(item.value)}`).join(', '),
    );
  }
  if (entry.isCrit) lines.push('💥 Критический успех!');
  if (entry.isCritFail) lines.push('💀 Критический провал!');

  const payload = {
    username,
    embeds: [{ title, description: lines.join('\n'), color }],
  };

  await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
