import { useEffect, useRef, useState } from 'react';
import { useCharacterAuth } from '@/features/character-editor/useCharacterAuth';
import { useCharacterState } from '@/features/character-editor/useCharacterState';
import {
  MAGIC_SKILLS,
  PERSONALITY_SKILLS,
} from '@/features/character-editor/characterCalculations';
import {
  rollDice,
  recordDiceRoll,
  type DiceRollResult,
  type RollContext,
} from '@/features/character-editor/diceRoller';
import { CharacterRepository } from '@/shared/repositories/CharacterRepository';
import { CompendiumRepository } from '@/shared/repositories/CompendiumRepository';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { Tabs, type TabItem } from '@/shared/ui/Tabs';
import type { Character, CharacterBonus, CharacterSpell } from '@/entities/character/types';
import type { School, Spell } from '@/entities/compendium/types';
import styles from './CharacterEditorPage.module.css';

type View = 'list' | 'editor';
type EditorTab = 'game' | 'bonuses' | 'stats' | 'spells' | 'inventory' | 'craft' | 'description';

const EDITOR_TABS: TabItem<EditorTab>[] = [
  { key: 'game', label: 'Игровой Режим' },
  { key: 'bonuses', label: 'Бонусы' },
  { key: 'stats', label: 'Характеристики' },
  { key: 'spells', label: 'Заклинания' },
  { key: 'inventory', label: 'Инвентарь' },
  { key: 'craft', label: 'Ремесло' },
  { key: 'description', label: 'Описание' },
];

const LOCAL_CHARACTERS_KEY = 'emagiosCharacters';
const TEST_GUEST_MODE_KEY = 'emagiosTestGuestCharacters';

function isGuestTestModeEnabled(): boolean {
  if (import.meta.env.MODE === 'test') return true;
  try {
    return localStorage.getItem(TEST_GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function readLocalCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHARACTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Character[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCharacters(characters: Character[]) {
  localStorage.setItem(LOCAL_CHARACTERS_KEY, JSON.stringify(characters));
}

function downloadCharacter(character: Character) {
  const json = JSON.stringify(character, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(character.name || 'character').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AuthBanner({
  auth,
  onSignIn,
  onSignOut,
}: {
  auth: { uid: string | null; displayName: string | null; email: string | null; loading: boolean };
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (auth.loading) return <div className={styles.authBanner}>Загружаем...</div>;
  if (!auth.uid) {
    return (
      <div className={styles.authBanner}>
        <span className={styles.authHint}>
          Войдите через Google, чтобы создавать и сохранять персонажей
        </span>
        <Button variant="outline" size="sm" onClick={onSignIn}>
          Войти через Google
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.authBanner}>
      <span>{auth.displayName ?? auth.email}</span>
      <Button variant="ghost" size="sm" onClick={onSignOut}>
        Выйти
      </Button>
    </div>
  );
}

function CharacterCard({
  character,
  onLoad,
  onDelete,
  onExport,
}: {
  character: Character;
  onLoad: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <div className={styles.characterCard}>
      <div className={styles.characterCardInfo}>
        <span className={styles.characterName}>{character.name || 'Без имени'}</span>
        <span className={styles.characterLevel}>Уровень {character.level}</span>
      </div>
      <div className={styles.characterCardActions}>
        <Button variant="outline" size="sm" onClick={onLoad}>
          Загрузить
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport}>
          Экспорт
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Удалить
        </Button>
      </div>
    </div>
  );
}

function SkillRow({
  name,
  level,
  onChange,
}: {
  name: string;
  level: number;
  onChange: (level: number) => void;
}) {
  return (
    <div className={styles.skillRow}>
      <span className={styles.skillName}>{name}</span>
      <div className={styles.skillDots}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={[styles.skillDot, level >= n && n > 0 ? styles.skillDotFilled : ''].join(
              ' ',
            )}
            onClick={() => onChange(level === n ? n - 1 : n)}
            title={`Уровень ${n}`}
          >
            {n === 0 ? '○' : '●'}
          </button>
        ))}
      </div>
    </div>
  );
}

/** +/- stepper for a resource pool (current vs max). */
function ResourceStepper({
  label,
  current,
  max,
  onChange,
}: {
  label: string;
  current: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.resourceStepper}>
      <span className={styles.resourceStepperLabel}>{label}</span>
      <div className={styles.stepperControl}>
        <Button variant="ghost" size="sm" onClick={() => onChange(Math.max(0, current - 1))}>
          −
        </Button>
        <span className={styles.stepperValue}>
          {current} / {max}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onChange(current + 1)}>
          +
        </Button>
      </div>
    </div>
  );
}

const CORE_ROLLS: { label: string; context: RollContext }[] = [
  { label: 'Аркана', context: 'arcana' },
  { label: 'Попадание', context: 'hit' },
  { label: 'Наложение', context: 'apply' },
];

function DiceRoller({ uid, characterId }: { uid: string | null; characterId: string | null }) {
  const [last, setLast] = useState<DiceRollResult | null>(null);
  const [sides, setSides] = useState(6);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);

  function doRoll(rollSides: number, rollCount: number, rollMod: number, context: RollContext) {
    const result = rollDice(rollSides, rollCount, rollMod, context);
    recordDiceRoll(result, { uid, characterId });
    setLast(result);
  }

  return (
    <div className={styles.diceRoller}>
      <h3>Броски кубов</h3>
      <div className={styles.diceCoreRow}>
        {CORE_ROLLS.map((roll) => (
          <Button
            key={roll.context}
            variant="secondary"
            size="sm"
            onClick={() => doRoll(12, 1, 0, roll.context)}
          >
            {roll.label} (d12)
          </Button>
        ))}
      </div>
      <div className={styles.diceCustomRow}>
        <label className={styles.diceField}>
          <span>Кубов</span>
          <Input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
          />
        </label>
        <label className={styles.diceField}>
          <span>Граней</span>
          <Select value={sides} onChange={(e) => setSides(Number(e.target.value))}>
            {[2, 4, 6, 8, 10, 12, 20, 100].map((s) => (
              <option key={s} value={s}>
                d{s}
              </option>
            ))}
          </Select>
        </label>
        <label className={styles.diceField}>
          <span>Модиф.</span>
          <Input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(Number(e.target.value))}
          />
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={() => doRoll(sides, count, modifier, 'custom')}
        >
          Бросить
        </Button>
      </div>
      {last && (
        <div className={styles.diceResult}>
          <span className={styles.diceExpression}>{last.expression}</span>
          <span className={styles.diceTotal}>{last.total}</span>
          <span className={styles.diceBreakdown}>[{last.rolls.join(', ')}]</span>
        </div>
      )}
    </div>
  );
}

function BonusesSection({
  bonuses,
  onChange,
}: {
  bonuses: CharacterBonus[];
  onChange: (next: CharacterBonus[]) => void;
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([
      ...bonuses,
      { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: trimmed, value },
    ]);
    setName('');
    setValue(0);
  }

  return (
    <div className={styles.section}>
      <h3>Временные Бонусы</h3>
      <div className={styles.bonusAddRow}>
        <Input
          placeholder="Название бонуса"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="number"
          className={styles.bonusValueInput}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <Button variant="secondary" size="sm" onClick={add} disabled={!name.trim()}>
          Добавить
        </Button>
      </div>
      {bonuses.length === 0 ? (
        <p className={styles.emptyHint}>Нет активных бонусов</p>
      ) : (
        <div className={styles.bonusList}>
          {bonuses.map((bonus) => (
            <div key={bonus.id} className={styles.bonusRow}>
              <span>{bonus.name}</span>
              <span className={styles.bonusValue}>
                {bonus.value > 0 ? `+${bonus.value}` : bonus.value}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(bonuses.filter((b) => b.id !== bonus.id))}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function spellToCharacterSpell(spell: Spell): CharacterSpell {
  return {
    id: spell.id,
    name: spell.name,
    source: spell.source,
    school: Array.isArray(spell.school) ? spell.school.join(', ') : spell.school,
    type: spell.type,
  };
}

export function CharacterEditorPage() {
  const authHook = useCharacterAuth();
  const state = useCharacterState(authHook.auth.uid, authHook.refreshCharacters);
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<EditorTab>('stats');
  const [guestTestMode] = useState(isGuestTestModeEnabled);
  const [localCharacters, setLocalCharacters] = useState<Character[]>(readLocalCharacters);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSpellId, setSelectedSpellId] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const isCloudMode = Boolean(authHook.auth.uid);
  const canEditCharacters = isCloudMode || guestTestMode;
  const visibleCharacters = isCloudMode
    ? authHook.characters
    : guestTestMode
      ? localCharacters
      : [];

  useEffect(() => {
    if (!canEditCharacters || view !== 'editor') return;
    let cancelled = false;
    Promise.all([CompendiumRepository.getSpells(), CompendiumRepository.getSchools()])
      .then(([spellItems, schoolItems]) => {
        if (cancelled) return;
        setSpells(spellItems as Spell[]);
        setSchools(schoolItems as School[]);
      })
      .catch(() => {
        if (cancelled) return;
        setSpells([]);
        setSchools([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canEditCharacters, view]);

  function handleNew() {
    if (!canEditCharacters) return;
    state.reset();
    setActiveTab('stats');
    setView('editor');
  }

  function handleLoad(character: Character) {
    if (!canEditCharacters) return;
    state.loadCharacter(character);
    setActiveTab('stats');
    setView('editor');
  }

  async function handleDelete(character: Character) {
    if (authHook.auth.uid) {
      await CharacterRepository.deleteCharacter(authHook.auth.uid, character.id);
      authHook.refreshCharacters();
      return;
    }
    if (!guestTestMode) return;
    const next = localCharacters.filter((c) => c.id !== character.id);
    setLocalCharacters(next);
    writeLocalCharacters(next);
  }

  async function handleSave() {
    if (authHook.auth.uid) {
      await state.saveNow(authHook.auth.uid);
      authHook.refreshCharacters();
      return;
    }
    if (!guestTestMode) return;
    const nextCharacter: Character = {
      ...state.character,
      updatedAt: new Date().toISOString(),
      version: (state.character.version ?? 0) + 1,
    };
    const exists = localCharacters.some((c) => c.id === nextCharacter.id);
    const next = exists
      ? localCharacters.map((c) => (c.id === nextCharacter.id ? nextCharacter : c))
      : [nextCharacter, ...localCharacters];
    setLocalCharacters(next);
    writeLocalCharacters(next);
    state.loadCharacter(nextCharacter);
  }

  async function handleImportFile(file: File) {
    if (!guestTestMode) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as Character;
    if (!parsed || typeof parsed !== 'object' || !parsed.id) {
      throw new Error('Invalid character file');
    }
    const imported: Character = {
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    const exists = localCharacters.some((c) => c.id === imported.id);
    const next = exists
      ? localCharacters.map((c) => (c.id === imported.id ? imported : c))
      : [imported, ...localCharacters];
    setLocalCharacters(next);
    writeLocalCharacters(next);
    state.loadCharacter(imported);
    setActiveTab('stats');
    setView('editor');
  }

  const { character, isDirty, isSaving, updateField, updateLevel, updateSkillLevel } = state;
  const { stats } = character;

  if (view === 'list') {
    return (
      <div className={styles.page}>
        <h1>Редактор Персонажей</h1>

        <AuthBanner
          auth={authHook.auth}
          onSignIn={authHook.signIn}
          onSignOut={authHook.signOutUser}
        />

        <div className={styles.listHeader}>
          <h2>Персонажи</h2>
          {canEditCharacters && (
            <div className={styles.listActions}>
              {guestTestMode && (
                <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
                  Импорт JSON
                </Button>
              )}
              <Button variant="primary" onClick={handleNew}>
                + Создать персонажа
              </Button>
            </div>
          )}
        </div>

        {guestTestMode && (
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                void handleImportFile(file);
              }
            }}
          />
        )}

        {isCloudMode && authHook.charactersLoading && (
          <div className={styles.hint}>Загружаем персонажей...</div>
        )}

        {!authHook.auth.uid && !authHook.auth.loading && (
          <div className={styles.hint}>
            {guestTestMode
              ? 'Тестовый режим: персонажи сохраняются в localStorage этого браузера.'
              : 'Войдите, чтобы увидеть сохранённых персонажей и создать нового.'}
          </div>
        )}

        {visibleCharacters.length > 0 && (
          <div className={styles.characterList}>
            {visibleCharacters.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onLoad={() => handleLoad(c)}
                onDelete={() => handleDelete(c)}
                onExport={() => downloadCharacter(c)}
              />
            ))}
          </div>
        )}

        {isCloudMode && !authHook.charactersLoading && visibleCharacters.length === 0 && (
          <div className={styles.hint}>Персонажей пока нет. Создайте первого!</div>
        )}
        {guestTestMode && visibleCharacters.length === 0 && (
          <div className={styles.hint}>
            Нет локально сохранённых персонажей. Создайте нового или импортируйте JSON.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.editorHeader}>
        <Button variant="ghost" size="sm" onClick={() => setView('list')}>
          ← Назад
        </Button>
        <h1 className={styles.editorTitle}>{character.name || 'Новый персонаж'}</h1>
        <div className={styles.editorActions}>
          {isDirty && <span className={styles.dirtyBadge}>Несохранённые изменения</span>}
          {isSaving && <span className={styles.savingBadge}>Сохранение...</span>}
          <Button variant="ghost" size="sm" onClick={() => downloadCharacter(character)}>
            Экспорт JSON
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
            {authHook.auth.uid ? 'Сохранить в облако' : 'Сохранить тестово'}
          </Button>
        </div>
      </div>

      {/* Top row with name + level — kept by request */}
      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          type="text"
          placeholder="Имя персонажа"
          value={character.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
        <div className={styles.levelControl}>
          <label className={styles.levelLabel}>Уровень</label>
          <input
            className={styles.levelInput}
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={(e) => updateLevel(Number(e.target.value))}
          />
        </div>
      </div>

      <Tabs items={EDITOR_TABS} active={activeTab} onChange={setActiveTab} variant="pills" />

      {activeTab === 'game' && (
        <div className={styles.section}>
          <h3>Игровой Режим</h3>
          <div className={styles.resourceStepperGrid}>
            <ResourceStepper
              label="Здоровье"
              current={character.currentHealth ?? stats.health}
              max={character.maxHealth ?? stats.health}
              onChange={(next) => updateField('currentHealth', next)}
            />
            <ResourceStepper
              label="Воля"
              current={character.currentWill ?? stats.will}
              max={character.maxWill ?? stats.will}
              onChange={(next) => updateField('currentWill', next)}
            />
          </div>
          <div className={styles.resourceGrid}>
            <label className={styles.resourceField}>
              <span>Защита</span>
              <Input
                type="number"
                value={character.defense ?? stats.evasion}
                onChange={(e) => updateField('defense', Number(e.target.value))}
              />
            </label>
            <label className={styles.resourceField}>
              <span>Макс. здоровье</span>
              <Input
                type="number"
                value={character.maxHealth ?? stats.health}
                onChange={(e) => updateField('maxHealth', Number(e.target.value))}
              />
            </label>
            <label className={styles.resourceField}>
              <span>Макс. воля</span>
              <Input
                type="number"
                value={character.maxWill ?? stats.will}
                onChange={(e) => updateField('maxWill', Number(e.target.value))}
              />
            </label>
          </div>
          <DiceRoller uid={authHook.auth.uid} characterId={character.id} />
        </div>
      )}

      {activeTab === 'bonuses' && (
        <BonusesSection
          bonuses={character.temporaryBonuses ?? []}
          onChange={(next) => updateField('temporaryBonuses', next)}
        />
      )}

      {activeTab === 'stats' && (
        <>
          <div className={styles.section}>
            <h3>Боевые Характеристики</h3>
            <div className={styles.statsGrid}>
              {[
                { label: 'Аркана', value: stats.arcana },
                { label: 'Здоровье', value: stats.health },
                { label: 'Воля', value: stats.will },
                { label: 'Скорость', value: stats.speed },
                { label: 'Инициатива', value: stats.initiative },
                { label: 'Бонус к Попаданию', value: `+${stats.hitBonus}` },
                { label: 'Бонус к Наложению', value: `+${stats.effectBonus}` },
                { label: 'Уклонение', value: stats.evasion },
                { label: 'Стойкость', value: stats.fortitude },
                { label: 'Действия', value: stats.actions },
                { label: 'Реакции', value: stats.reactions },
              ].map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.skillsSection}>
            <div className={styles.skillGroup}>
              <h3>Навыки Магии</h3>
              {MAGIC_SKILLS.map((skill) => {
                const sk = character.magicSkills.find((s) => s.id === skill.id);
                return (
                  <SkillRow
                    key={skill.id}
                    name={skill.name}
                    level={sk?.level ?? 0}
                    onChange={(level) => updateSkillLevel('magic', skill.id, level)}
                  />
                );
              })}
            </div>
            <div className={styles.skillGroup}>
              <h3>Навыки Личности</h3>
              {PERSONALITY_SKILLS.map((skill) => {
                const sk = character.personalitySkills.find((s) => s.id === skill.id);
                return (
                  <SkillRow
                    key={skill.id}
                    name={skill.name}
                    level={sk?.level ?? 0}
                    onChange={(level) => updateSkillLevel('personality', skill.id, level)}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'spells' && (
        <div className={styles.section}>
          <h3>Заклинания</h3>
          <div className={styles.pickerRow}>
            <Select
              value={selectedSpellId}
              onChange={(event) => setSelectedSpellId(event.target.value)}
            >
              <option value="">Выберите заклинание из БД</option>
              {spells.map((spell) => (
                <option key={spell.id} value={spell.id}>
                  {spell.name}
                </option>
              ))}
            </Select>
            {(['study', 'signature', 'spontaneous'] as const).map((type) => (
              <Button
                key={type}
                variant="secondary"
                size="sm"
                disabled={!selectedSpellId}
                onClick={() => {
                  const spell = spells.find((item) => item.id === selectedSpellId);
                  if (spell) state.addSpell(type, spellToCharacterSpell(spell));
                }}
              >
                {type === 'study'
                  ? 'В учебные'
                  : type === 'signature'
                    ? 'В фирменные'
                    : 'В спонтанные'}
              </Button>
            ))}
          </div>

          {(
            [
              { key: 'studySpells' as const, label: 'Учебные Заклинания', type: 'study' as const },
              {
                key: 'signatureSpells' as const,
                label: 'Фирменные Заклинания',
                type: 'signature' as const,
              },
              {
                key: 'spontaneousSpells' as const,
                label: 'Спонтанные Заклинания',
                type: 'spontaneous' as const,
              },
            ] as const
          ).map(({ key, label, type }) => (
            <div key={key} className={styles.spellGroup}>
              <h3>{label}</h3>
              {character[key].length === 0 && (
                <span className={styles.emptyHint}>Нет заклинаний</span>
              )}
              {character[key].map((spell) => (
                <div key={spell.id} className={styles.spellRow}>
                  <span>{spell.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => state.removeSpell(type, spell.id)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          ))}

          <div className={styles.spellGroup}>
            <h3>Школы Магии</h3>
            <div className={styles.pickerRow}>
              <Select
                value={selectedSchool}
                onChange={(event) => setSelectedSchool(event.target.value)}
              >
                <option value="">Выберите школу из БД</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                size="sm"
                disabled={!selectedSchool || character.schools.includes(selectedSchool)}
                onClick={() => {
                  updateField('schools', [...character.schools, selectedSchool]);
                  setSelectedSchool('');
                }}
              >
                Добавить школу
              </Button>
            </div>
            <Input
              placeholder="Например: Базовая Аркана, Огонь"
              value={character.schools.join(', ')}
              onChange={(e) =>
                updateField(
                  'schools',
                  e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className={styles.section}>
          <h3>Инвентарь</h3>
          <label className={styles.fieldLabel}>Экипировка</label>
          <Textarea
            placeholder="Экипировка..."
            value={character.equipment ?? ''}
            onChange={(e) => updateField('equipment', e.target.value)}
            rows={4}
          />
          <label className={styles.fieldLabel}>Предметы и снаряжение</label>
          <Textarea
            placeholder="Список предметов..."
            value={character.inventory ?? ''}
            onChange={(e) => updateField('inventory', e.target.value)}
            rows={6}
          />
        </div>
      )}

      {activeTab === 'craft' && (
        <div className={styles.section}>
          <h3>Ремесло</h3>
          <label className={styles.fieldLabel}>Профессии</label>
          <Textarea
            placeholder="Профессии и специализации..."
            value={character.professions ?? ''}
            onChange={(e) => updateField('professions', e.target.value)}
            rows={4}
          />
          <label className={styles.fieldLabel}>Рецепты</label>
          <Textarea
            placeholder="Известные рецепты..."
            value={character.recipes ?? ''}
            onChange={(e) => updateField('recipes', e.target.value)}
            rows={6}
          />
        </div>
      )}

      {activeTab === 'description' && (
        <div className={styles.section}>
          <h3>Описание персонажа</h3>
          <label className={styles.fieldLabel}>О персонаже</label>
          <Textarea
            placeholder="Описание персонажа..."
            value={character.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
          />
          <div className={styles.descGrid}>
            <label className={styles.resourceField}>
              <span>Мировоззрение</span>
              <Input
                value={character.alignment ?? ''}
                onChange={(e) => updateField('alignment', e.target.value)}
                placeholder="Напр.: Нейтрально-добрый"
              />
            </label>
            <label className={styles.resourceField}>
              <span>Пол</span>
              <Input
                value={character.gender ?? ''}
                onChange={(e) => updateField('gender', e.target.value)}
              />
            </label>
            <label className={styles.resourceField}>
              <span>Раса</span>
              <Input
                value={character.race ?? ''}
                onChange={(e) => updateField('race', e.target.value)}
              />
            </label>
          </div>
          <label className={styles.fieldLabel}>Внешний вид</label>
          <Textarea
            placeholder="Внешность персонажа..."
            value={character.appearance ?? ''}
            onChange={(e) => updateField('appearance', e.target.value)}
            rows={3}
          />
          <label className={styles.fieldLabel}>Взаимоотношения</label>
          <Textarea
            placeholder="Связи и отношения..."
            value={character.relationships ?? ''}
            onChange={(e) => updateField('relationships', e.target.value)}
            rows={3}
          />
          <label className={styles.fieldLabel}>Архетипы</label>
          <Input
            placeholder="Архетипы персонажа"
            value={character.archetypes.join(', ')}
            onChange={(e) =>
              updateField(
                'archetypes',
                e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
          />
          <label className={styles.fieldLabel}>Прочее</label>
          <Textarea
            placeholder="Заметки..."
            value={character.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
          />
        </div>
      )}
    </div>
  );
}
