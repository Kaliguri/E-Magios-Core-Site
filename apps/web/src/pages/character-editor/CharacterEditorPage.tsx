import { useRef, useState } from 'react';
import { useCharacterAuth } from '@/features/character-editor/useCharacterAuth';
import { useCharacterState } from '@/features/character-editor/useCharacterState';
import { MAGIC_SKILLS, PERSONALITY_SKILLS } from '@/features/character-editor/characterCalculations';
import { CharacterRepository } from '@/shared/repositories/CharacterRepository';
import { Button } from '@/shared/ui/Button';
import type { Character } from '@/entities/character/types';
import styles from './CharacterEditorPage.module.css';

type View = 'list' | 'editor';
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
        <span className={styles.authHint}>Войдите через Google, чтобы создавать и сохранять персонажей</span>
        <Button variant="outline" size="sm" onClick={onSignIn}>Войти через Google</Button>
      </div>
    );
  }
  return (
    <div className={styles.authBanner}>
      <span>{auth.displayName ?? auth.email}</span>
      <Button variant="ghost" size="sm" onClick={onSignOut}>Выйти</Button>
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
        <Button variant="outline" size="sm" onClick={onLoad}>Загрузить</Button>
        <Button variant="ghost" size="sm" onClick={onExport}>Экспорт</Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>Удалить</Button>
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
        {[0, 1, 2, 3].map(n => (
          <button
            key={n}
            className={[styles.skillDot, level >= n && n > 0 ? styles.skillDotFilled : ''].join(' ')}
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

export function CharacterEditorPage() {
  const authHook = useCharacterAuth();
  const state = useCharacterState(authHook.auth.uid, authHook.refreshCharacters);
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'spells'>('stats');
  const [guestTestMode] = useState(isGuestTestModeEnabled);
  const [localCharacters, setLocalCharacters] = useState<Character[]>(readLocalCharacters);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const isCloudMode = Boolean(authHook.auth.uid);
  const canEditCharacters = isCloudMode || guestTestMode;
  const visibleCharacters = isCloudMode ? authHook.characters : guestTestMode ? localCharacters : [];

  function handleNew() {
    if (!canEditCharacters) return;
    state.reset();
    setView('editor');
  }

  function handleLoad(character: Character) {
    if (!canEditCharacters) return;
    state.loadCharacter(character);
    setView('editor');
  }

  async function handleDelete(character: Character) {
    if (authHook.auth.uid) {
      await CharacterRepository.deleteCharacter(authHook.auth.uid, character.id);
      authHook.refreshCharacters();
      return;
    }
    if (!guestTestMode) return;
    const next = localCharacters.filter(c => c.id !== character.id);
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
    const exists = localCharacters.some(c => c.id === nextCharacter.id);
    const next = exists
      ? localCharacters.map(c => c.id === nextCharacter.id ? nextCharacter : c)
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
    const exists = localCharacters.some(c => c.id === imported.id);
    const next = exists
      ? localCharacters.map(c => c.id === imported.id ? imported : c)
      : [imported, ...localCharacters];
    setLocalCharacters(next);
    writeLocalCharacters(next);
    state.loadCharacter(imported);
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
                <Button variant="secondary" onClick={() => importInputRef.current?.click()}>Импорт JSON</Button>
              )}
              <Button variant="primary" onClick={handleNew}>+ Создать персонажа</Button>
            </div>
          )}
        </div>

        {guestTestMode && (
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={event => {
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
            {visibleCharacters.map(c => (
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
          <div className={styles.hint}>Нет локально сохранённых персонажей. Создайте нового или импортируйте JSON.</div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.editorHeader}>
        <Button variant="ghost" size="sm" onClick={() => setView('list')}>← Назад</Button>
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

      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          type="text"
          placeholder="Имя персонажа"
          value={character.name}
          onChange={e => updateField('name', e.target.value)}
        />
        <div className={styles.levelControl}>
          <label className={styles.levelLabel}>Уровень</label>
          <input
            className={styles.levelInput}
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={e => updateLevel(Number(e.target.value))}
          />
        </div>
      </div>

      <div className={styles.tabs}>
        {(['stats', 'skills', 'spells'] as const).map(tab => (
          <button
            key={tab}
            className={[styles.tab, activeTab === tab ? styles.tabActive : ''].join(' ')}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'stats' ? 'Характеристики' : tab === 'skills' ? 'Навыки' : 'Заклинания'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
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
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className={styles.skillsSection}>
          <div className={styles.skillGroup}>
            <h3>Навыки Магии</h3>
            {MAGIC_SKILLS.map(skill => {
              const sk = character.magicSkills.find(s => s.id === skill.id);
              return (
                <SkillRow
                  key={skill.id}
                  name={skill.name}
                  level={sk?.level ?? 0}
                  onChange={level => updateSkillLevel('magic', skill.id, level)}
                />
              );
            })}
          </div>
          <div className={styles.skillGroup}>
            <h3>Навыки Личности</h3>
            {PERSONALITY_SKILLS.map(skill => {
              const sk = character.personalitySkills.find(s => s.id === skill.id);
              return (
                <SkillRow
                  key={skill.id}
                  name={skill.name}
                  level={sk?.level ?? 0}
                  onChange={level => updateSkillLevel('personality', skill.id, level)}
                />
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'spells' && (
        <div className={styles.spellsSection}>
          {([
            { key: 'studySpells' as const, label: 'Учебные Заклинания' },
            { key: 'signatureSpells' as const, label: 'Фирменные Заклинания' },
            { key: 'spontaneousSpells' as const, label: 'Спонтанные Заклинания' },
          ] as const).map(({ key, label }) => (
            <div key={key} className={styles.spellGroup}>
              <h3>{label}</h3>
              {character[key].length === 0 && (
                <span className={styles.emptyHint}>Нет заклинаний</span>
              )}
              {character[key].map(spell => (
                <div key={spell.id} className={styles.spellRow}>
                  <span>{spell.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const type = key === 'studySpells' ? 'study' : key === 'signatureSpells' ? 'signature' : 'spontaneous';
                      state.removeSpell(type, spell.id);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          ))}
          <p className={styles.hint}>
            Добавление заклинаний через выбор из Базы Данных будет доступно в следующей версии.
          </p>
        </div>
      )}

      <div className={styles.notesSection}>
        <h3>Школы Магии</h3>
        <input
          className={styles.textInput}
          placeholder="Например: Базовая Аркана, Огонь"
          value={character.schools.join(', ')}
          onChange={e => updateField('schools', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
        />
        <h3>Архетипы</h3>
        <input
          className={styles.textInput}
          placeholder="Архетипы персонажа"
          value={character.archetypes.join(', ')}
          onChange={e => updateField('archetypes', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
        />
        <h3>Экипировка</h3>
        <textarea
          className={styles.textarea}
          placeholder="Экипировка..."
          value={character.equipment ?? ''}
          onChange={e => updateField('equipment', e.target.value)}
          rows={3}
        />
        <h3>Описание</h3>
        <textarea
          className={styles.textarea}
          placeholder="Описание персонажа..."
          value={character.description ?? ''}
          onChange={e => updateField('description', e.target.value)}
          rows={4}
        />
        <h3>Заметки</h3>
        <textarea
          className={styles.textarea}
          placeholder="Заметки..."
          value={character.notes ?? ''}
          onChange={e => updateField('notes', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
