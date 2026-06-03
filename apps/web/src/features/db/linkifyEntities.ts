// Auto-link well-known game terms inside already-rendered description HTML so a
// click opens the corresponding compendium entity in the global overlay — a port
// of the legacy `linkifySchoolText`/`linkifyResources` behaviour. We only wrap
// matches that sit in text nodes (between `>` and `<`), never inside tags or
// attribute values, and resolution happens lazily at click time, so an unknown
// term simply stays plain text.
import type { CompendiumEntityKey } from '@/entities/compendium/types';

export const ENTITY_NAME_ATTR = 'data-entity-name';
export const ENTITY_TYPE_ATTR = 'data-entity-type';

interface KeywordRule {
  re: RegExp;
  type: CompendiumEntityKey;
  /** Canonical entity name used for name-based resolution. */
  name: string;
}

// Order matters only for overlapping terms; these don't overlap.
const KEYWORDS: KeywordRule[] = [
  { re: /Воля/g, type: 'combat', name: 'Воля' },
  { re: /Концентраци(?:я|и|ю|ей)/g, type: 'actions', name: 'Концентрация' },
];

/** Collections that description keywords may resolve into — preloaded by the modal. */
export const KEYWORD_LINK_TYPES: CompendiumEntityKey[] = ['combat', 'actions'];

function wrapMatch(match: string, rule: KeywordRule): string {
  return (
    `<a href="#" class="entity-keyword-link" ${ENTITY_NAME_ATTR}="${rule.name}" ` +
    `${ENTITY_TYPE_ATTR}="${rule.type}">${match}</a>`
  );
}

function linkifyTextSegment(text: string): string {
  let result = text;
  for (const rule of KEYWORDS) {
    rule.re.lastIndex = 0;
    result = result.replace(rule.re, (m) => wrapMatch(m, rule));
  }
  return result;
}

export function linkifyKeywords(html: string): string {
  if (!html) return html;
  // Replace only inside text nodes: the captured group is the run of characters
  // between a closing `>` and the next opening `<`.
  return html.replace(/>([^<]+)</g, (_full, text: string) => `>${linkifyTextSegment(text)}<`);
}
