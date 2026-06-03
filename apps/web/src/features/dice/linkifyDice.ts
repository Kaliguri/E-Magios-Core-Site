// Wrap dice formulas (2d4, 3d8, 2d4+1, 1d12-2 …) in a clickable element so they
// roll in the global widget. Mirrors the legacy `linkifyDiceExpressions` and is
// applied to already-rendered description HTML.

export const DICE_ROLL_ATTR = 'data-dice-roll';

const DICE_RE = /\b(\d{1,3})d(2|4|6|8|10|12|20|100)([+-]\d+)?\b/g;

export function linkifyDiceExpressions(html: string): string {
  if (!html) return html;
  return html.replace(DICE_RE, (match) => {
    const escaped = match.replace(/"/g, '&quot;');
    return `<span class="dice-roll-link" role="button" tabindex="0" ${DICE_ROLL_ATTR}="${escaped}">${match}</span>`;
  });
}
