import { useState, type MouseEvent } from 'react';
import type { CompendiumEntity } from '@/entities/compendium/types';
import type { Spell, School, Effect, Action, Skill, Recipe } from '@/entities/compendium/types';
import type { CompendiumEntityKey } from '@/entities/compendium/types';
import type { EntityRef } from '@/features/db/useCompendiumIndex';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { LegacyText, renderLegacyTextHtml } from '@/shared/ui/LegacyText';
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
}

function Row({ label, value }: { label: string; value?: unknown }) {
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{display}</span>
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
  onNavigateTo,
}: {
  html: string;
  onNavigateTo?: (ref: EntityRef) => void;
}) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a');
    if (!anchor || !onNavigateTo) return;

    const ref = extractDbLinkRef(anchor.getAttribute('onclick') ?? anchor.getAttribute('href'));
    if (!ref) return;

    event.preventDefault();
    onNavigateTo(ref);
  }

  return (
    <div
      className={styles.htmlBlock}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: renderLegacyTextHtml(html, true) }}
    />
  );
}

function NavigateTag({
  label,
  entityType,
  resolveEntityByName,
  onNavigateTo,
}: {
  label: string;
  entityType: CompendiumEntityKey;
  resolveEntityByName?: (name: string, type: CompendiumEntityKey) => EntityRef | null;
  onNavigateTo?: (ref: EntityRef) => void;
}) {
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

function formatBonus(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function extractSpellRollBonus(description: string | undefined, label: string): number | null {
  if (!description) return null;
  const match = description.match(new RegExp(`${label}[^()]*\\(([+-]?\\d+)\\)`, 'i'));
  return match?.[1] ? Number(match[1]) : null;
}

function SpellRollFooter({ spell }: { spell: Spell }) {
  const [result, setResult] = useState<string | null>(null);
  const hitBonus = extractSpellRollBonus(spell.description, 'Бросок на Попадание');
  const applyBonus = extractSpellRollBonus(spell.description, 'Бросок на Наложение');
  const rolls = [
    { key: 'arcana', label: 'Бросок на Аркану', bonus: 0, enabled: true },
    { key: 'hit', label: 'Бросок на Попадание', bonus: hitBonus ?? 0, enabled: hitBonus !== null },
    { key: 'apply', label: 'Бросок на Наложение', bonus: applyBonus ?? 0, enabled: applyBonus !== null },
  ];

  return (
    <div className={styles.rollFooter}>
      {rolls.map(roll => (
        <button
          key={roll.key}
          type="button"
          className={styles.rollButton}
          disabled={!roll.enabled}
          onClick={() => {
            const d20 = Math.floor(Math.random() * 20) + 1;
            const total = d20 + roll.bonus;
            setResult(`${roll.label} ${formatBonus(roll.bonus)}: d20=${d20}, итог ${total}`);
          }}
        >
          {roll.label} ({formatBonus(roll.bonus)})
        </button>
      ))}
      {result && <span className={styles.rollResult}>{result}</span>}
    </div>
  );
}

function SpellDetail({
  spell,
  onNavigateTo,
}: {
  spell: Spell;
  onNavigateTo?: (ref: EntityRef) => void;
}) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{spell.name}</h2>
      <div className={styles.params}>
        <Row label="Действия" value={spell.actions} />
        <Row label="Ресурсы" value={spell.resources} />
        <Row label="Дистанция" value={spell.range} />
        <Row label="Цель" value={spell.target} />
        <Row label="Длительность" value={spell.duration} />
        <Row label="Школа" value={spell.school} />
        <Row label="Тип" value={spell.type} />
        <Row label="Тип урона" value={spell.damageType} />
        <Row label="Требуемый уровень" value={spell.requiredLevel} />
        <Row label="Концентрация" value={spell.concentration} />
        <Row label="Поддержание" value={spell.maintenance} />
        <Row label="Источник" value={spell.source} />
        {spell.parentName && spell.parentId && onNavigateTo ? (
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
          <Row label="Родительское заклинание" value={spell.parentName} />
        )}
      </div>
      {spell.description && (
        <div className={styles.section}>
          <HtmlBlock html={spell.description} onNavigateTo={onNavigateTo} />
        </div>
      )}
      {spell.subSpells && spell.subSpells.length > 0 && (
        <div className={styles.section}>
          <h4>Подзаклинания</h4>
          <ul className={styles.list}>
            {spell.subSpells.map(sub => (
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
                {sub.description ? ` — ${sub.description.replace(/<[^>]+>/g, '').slice(0, 180)}${sub.description.length > 180 ? '...' : ''}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <SpellRollFooter spell={spell} />
    </div>
  );
}

function SchoolDetail({
  school,
  resolveEntityByName,
  onNavigateTo,
}: {
  school: School;
  resolveEntityByName?: (name: string, type: CompendiumEntityKey) => EntityRef | null;
  onNavigateTo?: (ref: EntityRef) => void;
}) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{school.name}</h2>
      <div className={styles.params}>
        <Row label="Редкость" value={school.rarity} />
        <Row label="Сложность" value={typeof school.difficulty === 'number'
          ? '★'.repeat(school.difficulty) + '☆'.repeat(Math.max(0, 3 - school.difficulty))
          : school.difficulty} />
        <Row label="Свойства" value={school.properties} />
      </div>
      {school.description && (
        <div className={styles.section}>
          <HtmlBlock html={school.description} onNavigateTo={onNavigateTo} />
        </div>
      )}
      {school.principles && school.principles.length > 0 && (
        <div className={styles.section}>
          <h4>Принципы</h4>
          <ul className={styles.list}>
            {school.principles.map((p, i) => <li key={i}><LegacyText text={p} /></li>)}
          </ul>
        </div>
      )}
      {school.features && school.features.length > 0 && (
        <div className={styles.section}>
          <h4>Особенности</h4>
          <ul className={styles.list}>
            {school.features.map((f, i) => <li key={i}><LegacyText text={f} /></li>)}
          </ul>
        </div>
      )}
      {school.educationalSpells && school.educationalSpells.length > 0 && (
        <div className={styles.section}>
          <h4>Учебные заклинания</h4>
          <ul className={styles.list}>
            {school.educationalSpells.map((s, i) => <li key={i}><LegacyText text={s} /></li>)}
          </ul>
        </div>
      )}
      {school.relatedSchools && school.relatedSchools.length > 0 && (
        <div className={styles.section}>
          <h4>Связанные школы</h4>
          <div className={styles.tags}>
            {school.relatedSchools.map((s, i) => (
              <NavigateTag
                key={i}
                label={s}
                entityType="schools"
                resolveEntityByName={resolveEntityByName}
                onNavigateTo={onNavigateTo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EffectDetail({ effect }: { effect: Effect }) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{effect.name}</h2>
      <div className={styles.params}>
        <Row label="Тип действия" value={effect.actionType} />
      </div>
      {effect.description && (
        <div className={styles.section}>
          <HtmlBlock html={effect.description} />
        </div>
      )}
    </div>
  );
}

function ActionDetail({ action }: { action: Action }) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{action.name}</h2>
      <div className={styles.params}>
        <Row label="Тип" value={action.kind} />
        <Row label="Действия" value={action.actions} />
        <Row label="Дистанция" value={action.range} />
        <Row label="Цель" value={action.target} />
        <Row label="Длительность" value={action.duration} />
      </div>
      {action.description && (
        <div className={styles.section}>
          <HtmlBlock html={action.description} />
        </div>
      )}
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{skill.name}</h2>
      <div className={styles.params}>
        <Row label="Тип" value={skill.type} />
      </div>
      {skill.description && (
        <div className={styles.section}>
          <HtmlBlock html={skill.description} />
        </div>
      )}
    </div>
  );
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{recipe.name}</h2>
      <div className={styles.params}>
        <Row label="Профессия" value={recipe.profession} />
        <Row label="Специализация" value={recipe.specialization} />
        <Row label="Уровень" value={recipe.recipeLevel} />
        <Row label="Редкость" value={recipe.recipeRarity} />
        <Row label="Стоимость" value={recipe.recipeCost} />
        <Row label="Типы" value={recipe.recipeTypes} />
      </div>
      {recipe.steps && recipe.steps.length > 0 && (
        <div className={styles.section}>
          <h4>Этапы</h4>
          <ul className={styles.list}>
            {recipe.steps.map((step, i) => (
              <li key={i}><LegacyText text={`${step.name} — прогресс: ${step.progress}`} /></li>
            ))}
          </ul>
        </div>
      )}
      {recipe.description && (
        <div className={styles.section}>
          <HtmlBlock html={recipe.description} />
        </div>
      )}
    </div>
  );
}

function GenericDetail({ entity }: { entity: CompendiumEntity }) {
  const rec = entity as unknown as Record<string, unknown>;
  const desc = typeof rec['description'] === 'string' ? rec['description'] : null;
  return (
    <div className={styles.detail}>
      <h2 className={styles.entityName}>{String(rec['name'] ?? '')}</h2>
      {desc && (
        <div className={styles.section}>
          <HtmlBlock html={desc} />
        </div>
      )}
    </div>
  );
}

function EntityDetail({
  entity,
  entityType,
  resolveEntityByName,
  onNavigateTo,
}: {
  entity: CompendiumEntity;
  entityType: string;
  resolveEntityByName?: (name: string, type: CompendiumEntityKey) => EntityRef | null;
  onNavigateTo?: (ref: EntityRef) => void;
}) {
  switch (entityType) {
    case 'spells': return <SpellDetail spell={entity as Spell} onNavigateTo={onNavigateTo} />;
    case 'schools': return (
      <SchoolDetail
        school={entity as School}
        resolveEntityByName={resolveEntityByName}
        onNavigateTo={onNavigateTo}
      />
    );
    case 'effects': return <EffectDetail effect={entity as Effect} />;
    case 'actions': return <ActionDetail action={entity as Action} />;
    case 'skills': return <SkillDetail skill={entity as Skill} />;
    case 'recipes': return <RecipeDetail recipe={entity as Recipe} />;
    default: return <GenericDetail entity={entity} />;
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
}: DetailModalProps) {
  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} disabled={!canGoBack}>← Назад</Button>
      <Button variant="ghost" size="sm" onClick={onForward} disabled={!canGoForward}>Вперёд →</Button>
      <Button variant="secondary" size="sm" onClick={onClose}>Закрыть</Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entity ? String((entity as unknown as Record<string, unknown>)['name'] ?? '') : ''}
      footer={footer}
    >
      {entity && (
        <EntityDetail
          entity={entity}
          entityType={entityType}
          resolveEntityByName={resolveEntityByName}
          onNavigateTo={onNavigateTo}
        />
      )}
    </Modal>
  );
}
