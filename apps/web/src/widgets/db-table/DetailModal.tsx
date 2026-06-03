import { createContext, useContext, useEffect, type MouseEvent, type ReactNode } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';
import type { Spell, School, Effect, Action, Skill, Recipe } from '@/entities/compendium/types';
import type { CompendiumEntityKey } from '@/entities/compendium/types';
import type { EntityRef } from '@/features/db/useCompendiumIndex';
import {
  linkifyKeywords,
  KEYWORD_LINK_TYPES,
  ENTITY_NAME_ATTR,
  ENTITY_TYPE_ATTR,
} from '@/features/db/linkifyEntities';
import { useDice, linkifyDiceExpressions, DICE_ROLL_ATTR, type RollType } from '@/features/dice';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { LegacyText, renderLegacyTextHtml } from '@/shared/ui/LegacyText';
import { isCompendiumKey } from '@/entities/compendium/config';
import styles from './DetailModal.module.css';

interface DetailModalProps {
  open: boolean;
  entity: CompendiumEntity | null;
  entityType: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onClose: () => void;
  onBack: () => void;
  onForward: () => void;
  onNavigateTo?: (ref: EntityRef) => void;
  resolveEntityByName?: (name: string, type: CompendiumEntityKey) => EntityRef | null;
  /** Preload a collection so cross-links inside the detail resolve to buttons. */
  ensureLoaded?: (entityType: CompendiumEntityKey) => void;
}

/**
 * Shared link context so any nested value can turn a name into an overlay link
 * without prop-drilling. Mirrors the legacy behaviour where nearly every
 * parameter (school, action type, resource…) was a clickable cross-reference.
 */
interface DetailLinkValue {
  onNavigateTo?: (ref: EntityRef) => void;
  resolveEntityByName?: (name: string, type: CompendiumEntityKey) => EntityRef | null;
  ensureLoaded?: (entityType: CompendiumEntityKey) => void;
}
const DetailLinkContext = createContext<DetailLinkValue>({});
function useDetailLinks() {
  return useContext(DetailLinkContext);
}

/** A single name rendered as an overlay link when it resolves, else plain text. */
function EntityRefLink({ name, entityType }: { name: string; entityType: CompendiumEntityKey }) {
  const { onNavigateTo, resolveEntityByName, ensureLoaded } = useDetailLinks();
  useEffect(() => {
    ensureLoaded?.(entityType);
  }, [entityType, ensureLoaded]);
  const ref = resolveEntityByName?.(name.trim(), entityType) ?? null;
  if (!ref || !onNavigateTo) return <span>{name}</span>;
  return (
    <button type="button" className={styles.inlineLink} onClick={() => onNavigateTo(ref)}>
      {name}
    </button>
  );
}

/** Render a comma/`;`-separated value as a row of {@link EntityRefLink}s. */
function LinkedValue({
  value,
  entityType,
}: {
  value: string | string[];
  entityType: CompendiumEntityKey;
}) {
  const parts = (Array.isArray(value) ? value : String(value).split(/[,;]/))
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {i > 0 ? ', ' : ''}
          <EntityRefLink name={part} entityType={entityType} />
        </span>
      ))}
    </>
  );
}

function Row({
  label,
  value,
  linkType,
}: {
  label: string;
  value?: unknown;
  /** When set, the value is split and rendered as overlay cross-links. */
  linkType?: CompendiumEntityKey;
}) {
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>
        {linkType ? (
          <LinkedValue value={value as string | string[]} entityType={linkType} />
        ) : Array.isArray(value) ? (
          value.join(', ')
        ) : (
          String(value)
        )}
      </span>
    </div>
  );
}

function extractDbLinkRef(raw: string | null): EntityRef | null {
  if (!raw) return null;
  const patterns: Array<[RegExp, CompendiumEntityKey]> = [
    [/showSpellPage\(['"]([^'"]+)['"]\)/, 'spells'],
    [/showSchoolPage\(['"]([^'"]+)['"]\)/, 'schools'],
    [/showEffectPage\(['"]([^'"]+)['"]\)/, 'effects'],
    [/showBasicPage\(['"]([^'"]+)['"]\)/, 'basics'],
    [/showCombatPage\(['"]([^'"]+)['"]\)/, 'combat'],
    [/showActionTypePage\(['"]([^'"]+)['"]\)/, 'action-types'],
    [/showCraftComponentPage\(['"]([^'"]+)['"]\)/, 'craft-components'],
  ];
  for (const [pattern, entityType] of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return { entityType, id: match[1] };
  }
  return null;
}

function HtmlBlock({
  html,
  rollLabel,
}: {
  html: string;
  /** Label used when a dice formula inside the text is clicked to roll. */
  rollLabel?: string;
}) {
  const dice = useDice();
  const { onNavigateTo, resolveEntityByName } = useDetailLinks();

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;

    // A clicked dice formula rolls it literally (damage formulas don't take a
    // character bonus) in the global widget.
    const diceEl = target?.closest(`[${DICE_ROLL_ATTR}]`);
    const expression = diceEl?.getAttribute(DICE_ROLL_ATTR);
    if (expression) {
      event.preventDefault();
      dice.roll({ expression, label: rollLabel ?? null, applyCharacterBonus: false });
      return;
    }

    // An auto-linked keyword (Воля, Концентрация…) opens the named entity.
    const kw = target?.closest(`[${ENTITY_NAME_ATTR}]`);
    const kwName = kw?.getAttribute(ENTITY_NAME_ATTR);
    const kwType = kw?.getAttribute(ENTITY_TYPE_ATTR) ?? null;
    if (kwName && isCompendiumKey(kwType) && resolveEntityByName && onNavigateTo) {
      const ref = resolveEntityByName(kwName, kwType);
      if (ref) {
        event.preventDefault();
        onNavigateTo(ref);
        return;
      }
    }

    const anchor = target?.closest('a');
    if (!anchor || !onNavigateTo) return;
    const ref = extractDbLinkRef(anchor.getAttribute('onclick') ?? anchor.getAttribute('href'));
    if (!ref) return;
    event.preventDefault();
    onNavigateTo(ref);
  }

  const rendered = linkifyKeywords(linkifyDiceExpressions(renderLegacyTextHtml(html, true)));
  return (
    <div
      className={styles.htmlBlock}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function NavigateTag({ label, entityType }: { label: string; entityType: CompendiumEntityKey }) {
  const { onNavigateTo, resolveEntityByName } = useDetailLinks();
  const target = resolveEntityByName?.(label, entityType) ?? null;
  if (!target || !onNavigateTo) {
    return <span className={styles.tag}>{label}</span>;
  }
  return (
    <button
      type="button"
      className={[styles.tag, styles.tagButton].join(' ')}
      onClick={() => onNavigateTo(target)}
    >
      {label}
    </button>
  );
}

/** "Связи" footer: links back to related compendium/book entries (legacy parity). */
function RelationsFooter({ children }: { children: ReactNode }) {
  return (
    <div className={styles.relations}>
      <span className={styles.relationsLabel}>Связи:</span>
      <span className={styles.relationsBody}>{children}</span>
    </div>
  );
}

function formatBonus(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function extractSpellRollBonus(description: string | undefined, label: string): number | null {
  if (!description) return null;
  const match = description.match(new RegExp(`${label}[^()]*\\(([+-]?\\d+)\\)`, 'i'));
  return match?.[1] ? Number(match[1]) : null;
}

/**
 * Arcana / Hit / Apply quick rolls for a spell. They roll 1d12 (plus the
 * spell's own bonus from the description) in the global widget, which then
 * layers on the selected character's bonus, history, crit highlight and Discord.
 */
function SpellRollFooter({ spell }: { spell: Spell }) {
  const dice = useDice();
  const hitBonus = extractSpellRollBonus(spell.description, 'Бросок на Попадание');
  const applyBonus = extractSpellRollBonus(spell.description, 'Бросок на Наложение');
  const rolls: { key: RollType; label: string; mod: number }[] = [
    { key: 'arcana', label: 'Аркана', mod: 0 },
    { key: 'hit', label: 'Попадание', mod: hitBonus ?? 0 },
    { key: 'apply', label: 'Наложение', mod: applyBonus ?? 0 },
  ];

  return (
    <div className={styles.rollFooter}>
      {rolls.map((roll) => (
        <button
          key={roll.key}
          type="button"
          className={styles.rollButton}
          onClick={() =>
            dice.roll({
              expression: roll.mod ? `1d12${formatBonus(roll.mod)}` : '1d12',
              rollType: roll.key,
              label: `${spell.name} — ${roll.label}`,
              spellId: spell.id,
            })
          }
        >
          {roll.label}
          {roll.mod ? ` (${formatBonus(roll.mod)})` : ''}
        </button>
      ))}
    </div>
  );
}

function SpellDetail({ spell }: { spell: Spell }) {
  const { onNavigateTo } = useDetailLinks();
  const damage =
    spell.damageType != null
      ? [Array.isArray(spell.damageType) ? spell.damageType.join(', ') : spell.damageType]
          .filter(Boolean)
          .map((d) => (spell.damageTypeNote ? `${d} (${spell.damageTypeNote})` : d))[0]
      : undefined;

  return (
    <div className={styles.detail}>
      {spell.isSubSpell && (
        <div className={styles.metaRow}>
          <Badge tone="emerald">Подзаклинание</Badge>
          {spell.parentName && (
            <span className={styles.metaPart}>
              Часть:{' '}
              {spell.parentId && onNavigateTo ? (
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => onNavigateTo({ entityType: 'spells', id: spell.parentId! })}
                >
                  {spell.parentName}
                </button>
              ) : (
                spell.parentName
              )}
            </span>
          )}
        </div>
      )}
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Действия" value={spell.actions} />
        <Row label="Ресурсы" value={spell.resources} linkType="combat" />
        <Row label="Дистанция" value={spell.range} linkType="basics" />
        <Row label="Цель/Область" value={spell.target} linkType="basics" />
        <Row label="Длительность" value={spell.duration} />
        <Row label="Школа Магии" value={spell.school} linkType="schools" />
        <Row label="Тип Действия" value={spell.type} linkType="action-types" />
        <Row label="Тип урона" value={damage} />
        <Row label="Требование к уровню" value={spell.requiredLevel} />
        <Row label="Концентрация" value={spell.concentration} linkType="actions" />
        <Row label="Поддержание" value={spell.maintenance} />
        <Row label="Источник" value={spell.source} />
        {!spell.isSubSpell && spell.parentName && spell.parentId && onNavigateTo ? (
          <div className={styles.row}>
            <span className={styles.label}>Родительское заклинание:</span>
            <button
              type="button"
              className={styles.inlineLink}
              onClick={() => onNavigateTo({ entityType: 'spells', id: spell.parentId! })}
            >
              {spell.parentName}
            </button>
          </div>
        ) : (
          !spell.isSubSpell && <Row label="Родительское заклинание" value={spell.parentName} />
        )}
      </div>
      {spell.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={spell.description} rollLabel={spell.name} />
        </div>
      )}
      {spell.subSpells && spell.subSpells.length > 0 && (
        <div className={styles.section}>
          <h4>Подзаклинания</h4>
          <ul className={styles.list}>
            {spell.subSpells.map((sub) => (
              <li key={sub.id}>
                {onNavigateTo ? (
                  <button
                    type="button"
                    className={styles.inlineLink}
                    onClick={() => onNavigateTo({ entityType: 'spells', id: sub.id })}
                  >
                    {sub.name}
                  </button>
                ) : (
                  <strong>{sub.name}</strong>
                )}
                {sub.description
                  ? ` — ${sub.description.replace(/<[^>]+>/g, '').slice(0, 180)}${sub.description.length > 180 ? '...' : ''}`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <SpellRollFooter spell={spell} />
    </div>
  );
}

function SchoolDetail({ school }: { school: School }) {
  return (
    <div className={styles.detail}>
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Редкость" value={school.rarity} />
        <Row
          label="Сложность"
          value={
            typeof school.difficulty === 'number'
              ? '★'.repeat(school.difficulty) + '☆'.repeat(Math.max(0, 3 - school.difficulty))
              : school.difficulty
          }
        />
        <Row label="Свойства" value={school.properties} />
      </div>
      {school.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={school.description} />
        </div>
      )}
      {school.principles && school.principles.length > 0 && (
        <div className={styles.section}>
          <h4>Принципы</h4>
          <ul className={styles.list}>
            {school.principles.map((p, i) => (
              <li key={i}>
                <LegacyText text={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {school.features && school.features.length > 0 && (
        <div className={styles.section}>
          <h4>Особенности</h4>
          <ul className={styles.list}>
            {school.features.map((f, i) => (
              <li key={i}>
                <LegacyText text={f} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {school.educationalSpells && school.educationalSpells.length > 0 && (
        <div className={styles.section}>
          <h4>Учебные заклинания</h4>
          <ul className={styles.list}>
            {school.educationalSpells.map((s, i) => (
              <li key={i}>
                <EntityRefLink name={s} entityType="spells" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {school.relatedSchools && school.relatedSchools.length > 0 && (
        <div className={styles.section}>
          <h4>Связанные школы</h4>
          <div className={styles.tags}>
            {school.relatedSchools.map((s, i) => (
              <NavigateTag key={i} label={s} entityType="schools" />
            ))}
          </div>
        </div>
      )}
      <RelationsFooter>
        {school.relatedSchools && school.relatedSchools.length > 0 && (
          <>
            {school.relatedSchools.map((s, i) => (
              <span key={s}>
                {i > 0 ? ', ' : ''}
                <EntityRefLink name={s} entityType="schools" />
              </span>
            ))}
            {', '}
          </>
        )}
        <a
          className={styles.bookLink}
          href={`${import.meta.env.BASE_URL}#/spellbook/schools`}
          target="_blank"
          rel="noreferrer"
        >
          Школы Магии
        </a>
      </RelationsFooter>
    </div>
  );
}

function EffectDetail({ effect }: { effect: Effect }) {
  return (
    <div className={styles.detail}>
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Тип действия" value={effect.actionType} linkType="action-types" />
      </div>
      {effect.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={effect.description} />
        </div>
      )}
    </div>
  );
}

function ActionDetail({ action }: { action: Action }) {
  return (
    <div className={styles.detail}>
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Тип" value={action.kind} />
        <Row label="Действия" value={action.actions} />
        <Row label="Дистанция" value={action.range} linkType="basics" />
        <Row label="Цель/Область" value={action.target} linkType="basics" />
        <Row label="Длительность" value={action.duration} />
      </div>
      {action.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={action.description} />
        </div>
      )}
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <div className={styles.detail}>
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Тип" value={skill.type} />
      </div>
      {skill.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={skill.description} />
        </div>
      )}
    </div>
  );
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div className={styles.detail}>
      <h3 className={styles.sectionHeading}>Параметры</h3>
      <div className={styles.params}>
        <Row label="Профессия" value={recipe.profession} linkType="craft-professions" />
        <Row label="Специализация" value={recipe.specialization} linkType="craft-specializations" />
        <Row label="Уровень" value={recipe.recipeLevel} />
        <Row label="Редкость" value={recipe.recipeRarity} />
        <Row label="Стоимость" value={recipe.recipeCost} />
        <Row label="Типы" value={recipe.recipeTypes} linkType="recipe-types" />
      </div>
      {recipe.steps && recipe.steps.length > 0 && (
        <div className={styles.section}>
          <h4>Этапы</h4>
          <ul className={styles.list}>
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <LegacyText text={`${step.name} — прогресс: ${step.progress}`} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {recipe.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={recipe.description} />
        </div>
      )}
    </div>
  );
}

// Known structured fields surfaced (in order) for entity types without a bespoke
// detail layout — basics/combat (section, page), craft specializations
// (profession), etc. Anything absent on the entity is skipped by Row.
const GENERIC_META: [string, string, CompendiumEntityKey?][] = [
  ['type', 'Тип'],
  ['kind', 'Тип'],
  ['actionType', 'Тип действия', 'action-types'],
  ['section', 'Раздел'],
  ['page', 'Страница'],
  ['profession', 'Профессия', 'craft-professions'],
  ['specialization', 'Специализация', 'craft-specializations'],
  ['rarity', 'Редкость'],
];

function GenericDetail({ entity }: { entity: CompendiumEntity }) {
  const rec = entity as unknown as Record<string, unknown>;
  const desc = typeof rec['description'] === 'string' ? rec['description'] : null;
  const metaRows = GENERIC_META.filter(([key]) => rec[key] != null && rec[key] !== '');
  return (
    <div className={styles.detail}>
      {metaRows.length > 0 && (
        <>
          <h3 className={styles.sectionHeading}>Параметры</h3>
          <div className={styles.params}>
            {metaRows.map(([key, label, linkType]) => (
              <Row key={key} label={label} value={rec[key]} linkType={linkType} />
            ))}
          </div>
        </>
      )}
      {desc && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Описание</h3>
          <HtmlBlock html={desc} rollLabel={String(rec['name'] ?? '')} />
        </div>
      )}
    </div>
  );
}

function EntityDetail({ entity, entityType }: { entity: CompendiumEntity; entityType: string }) {
  switch (entityType) {
    case 'spells':
      return <SpellDetail spell={entity as Spell} />;
    case 'schools':
      return <SchoolDetail school={entity as School} />;
    case 'effects':
      return <EffectDetail effect={entity as Effect} />;
    case 'actions':
      return <ActionDetail action={entity as Action} />;
    case 'skills':
      return <SkillDetail skill={entity as Skill} />;
    case 'recipes':
      return <RecipeDetail recipe={entity as Recipe} />;
    default:
      return <GenericDetail entity={entity} />;
  }
}

export function DetailModal({
  open,
  entity,
  entityType,
  canGoBack,
  canGoForward,
  onClose,
  onBack,
  onForward,
  onNavigateTo,
  resolveEntityByName,
  ensureLoaded,
}: DetailModalProps) {
  // Preload the collections that descriptions/keywords commonly cross-link into,
  // so links resolve to buttons instead of plain text once the modal is open.
  useEffect(() => {
    if (!open || !ensureLoaded) return;
    for (const type of KEYWORD_LINK_TYPES) ensureLoaded(type);
  }, [open, entity, ensureLoaded]);

  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} disabled={!canGoBack}>
        ← Назад
      </Button>
      <Button variant="ghost" size="sm" onClick={onForward} disabled={!canGoForward}>
        Вперёд →
      </Button>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Закрыть
      </Button>
    </>
  );

  return (
    <DetailLinkContext.Provider value={{ onNavigateTo, resolveEntityByName, ensureLoaded }}>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        title={entity ? String((entity as unknown as Record<string, unknown>)['name'] ?? '') : ''}
        footer={footer}
      >
        {entity && <EntityDetail entity={entity} entityType={entityType} />}
      </Modal>
    </DetailLinkContext.Provider>
  );
}
