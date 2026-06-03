import { useMemo, useState, type FormEvent } from 'react';
import { useDice } from './DiceContext';
import { ROLL_TYPE_LABELS, buildCharacterBonus, type RollType } from './characterRollBonus';
import type { DiceHistoryEntry } from './types';
import styles from './DiceWidget.module.css';

const QUICK_DICE = [2, 4, 6, 8, 10, 12, 20, 100];
const CORE_ROLLS: { type: RollType; label: string }[] = [
  { type: 'arcana', label: ROLL_TYPE_LABELS.arcana },
  { type: 'hit', label: ROLL_TYPE_LABELS.hit },
  { type: 'apply', label: ROLL_TYPE_LABELS.apply },
];

function fmt(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function diceDetail(entry: DiceHistoryEntry): string {
  return entry.parts
    .filter((part) => part.kind === 'dice')
    .map((part) => (part.kind === 'dice' ? `[${part.rolls.join(', ')}]` : ''))
    .filter(Boolean)
    .join(' ');
}

function HistoryItem({ entry, detailed }: { entry: DiceHistoryEntry; detailed: boolean }) {
  const critClass = entry.isCrit ? styles.crit : entry.isCritFail ? styles.critFail : '';
  return (
    <li className={[styles.historyItem, critClass].join(' ')}>
      <div className={styles.historyTop}>
        <span className={styles.historyLabel}>
          {entry.label || entry.displayExpression || entry.expression}
          {entry.characterName ? ` · ${entry.characterName}` : ''}
        </span>
        <span className={styles.historyTotal}>{entry.total}</span>
      </div>
      <div className={styles.historyMeta}>
        <code>{entry.expression}</code> {diceDetail(entry)}
        {entry.isCrit && <span className={styles.critTag}>КРИТ</span>}
        {entry.isCritFail && <span className={styles.critFailTag}>ПРОВАЛ</span>}
      </div>
      {entry.bonus && entry.bonus.items.length > 0 && (
        <div className={styles.historyBonus}>
          {detailed
            ? entry.bonus.items.map((item, i) => (
                <div key={i} className={styles.detailLine}>
                  {item.label}: {fmt(item.value)}
                </div>
              ))
            : entry.bonus.items.map((item) => `${item.label} ${fmt(item.value)}`).join(', ')}
        </div>
      )}
    </li>
  );
}

export function DiceWidget() {
  const dice = useDice();
  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [charOpen, setCharOpen] = useState(false);
  const [charSearch, setCharSearch] = useState('');

  const selectedCharacter = dice.characters.find((c) => c.id === dice.selectedCharacterId) ?? null;

  // Per-roll-type bonus the selected character contributes (shown on core buttons).
  const coreBonuses = useMemo(() => {
    if (!selectedCharacter || !dice.rollFromCharacter) return null;
    return {
      arcana: buildCharacterBonus(selectedCharacter, 'arcana').total,
      hit: buildCharacterBonus(selectedCharacter, 'hit').total,
      apply: buildCharacterBonus(selectedCharacter, 'apply').total,
    } as Record<RollType, number>;
  }, [selectedCharacter, dice.rollFromCharacter]);

  const filteredCharacters = useMemo(() => {
    const q = charSearch.trim().toLocaleLowerCase('ru');
    if (!q) return dice.characters;
    return dice.characters.filter((c) => (c.name || '').toLocaleLowerCase('ru').includes(q));
  }, [dice.characters, charSearch]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const expression = input.trim();
    if (!expression) return;
    const entry = dice.roll({ expression });
    if (entry) setInput('');
  }

  if (!dice.open) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={() => dice.setOpen(true)}
        title="Броски кубов"
        aria-label="Открыть броски кубов"
      >
        🎲
      </button>
    );
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Броски кубов">
      <div className={styles.header}>
        <span className={styles.title}>🎲 Броски кубов</span>
        <div className={styles.headerActions}>
          <div className={styles.settingsWrap}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label="Настройки бросков"
              title="Настройки бросков"
              aria-expanded={settingsOpen}
            >
              ⚙
            </button>
            {settingsOpen && (
              <div className={styles.settingsMenu}>
                <label className={styles.settingsItem}>
                  <input
                    type="checkbox"
                    checked={dice.rollFromCharacter}
                    onChange={(e) => dice.setRollFromCharacter(e.target.checked)}
                  />
                  Совершать броски от персонажа
                </label>
                <label className={styles.settingsItem}>
                  <input
                    type="checkbox"
                    checked={dice.detailed}
                    onChange={(e) => dice.setDetailed(e.target.checked)}
                  />
                  Подробный режим броска
                </label>
                {dice.discordConfigured && (
                  <label className={styles.settingsItem}>
                    <input
                      type="checkbox"
                      checked={dice.sendToDiscord}
                      onChange={(e) => dice.setSendToDiscord(e.target.checked)}
                    />
                    Дублировать броски в Discord
                  </label>
                )}
                {dice.history.length > 0 && (
                  <button
                    type="button"
                    className={styles.settingsClear}
                    onClick={dice.clearHistory}
                  >
                    Очистить историю
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => dice.setOpen(false)}
            aria-label="Свернуть"
          >
            ×
          </button>
        </div>
      </div>

      {dice.characters.length > 0 && (
        <div className={styles.characterBlock}>
          <div className={styles.comboWrap}>
            <button
              type="button"
              className={styles.comboButton}
              onClick={() => setCharOpen((v) => !v)}
              aria-expanded={charOpen}
            >
              <span className={styles.comboValue}>
                {selectedCharacter
                  ? `${selectedCharacter.name || 'Без имени'} (ур. ${selectedCharacter.level})`
                  : 'Без персонажа'}
              </span>
              <span className={styles.comboArrow}>▾</span>
            </button>
            {charOpen && (
              <div className={styles.comboPanel}>
                <input
                  className={styles.comboSearch}
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  placeholder="Поиск персонажа"
                  autoComplete="off"
                  autoFocus
                />
                <div className={styles.comboOptions}>
                  <button
                    type="button"
                    className={styles.comboOption}
                    onClick={() => {
                      dice.setSelectedCharacterId(null);
                      setCharOpen(false);
                    }}
                  >
                    Без персонажа
                  </button>
                  {filteredCharacters.map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      className={[
                        styles.comboOption,
                        character.id === dice.selectedCharacterId ? styles.comboOptionActive : '',
                      ].join(' ')}
                      onClick={() => {
                        dice.setSelectedCharacterId(character.id);
                        setCharOpen(false);
                      }}
                    >
                      {character.name || 'Без имени'} (ур. {character.level})
                    </button>
                  ))}
                  {filteredCharacters.length === 0 && (
                    <div className={styles.comboEmpty}>Не найдено</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.coreRolls}>
        {CORE_ROLLS.map((roll) => {
          const bonus = coreBonuses?.[roll.type] ?? 0;
          return (
            <button
              key={roll.type}
              type="button"
              className={styles.coreButton}
              onClick={() =>
                dice.roll({ expression: '1d12', rollType: roll.type, label: roll.label })
              }
            >
              {roll.label}
              <span className={styles.coreDie}>d12{bonus ? ` ${fmt(bonus)}` : ''}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.quickGrid}>
        {QUICK_DICE.map((sides) => (
          <button
            key={sides}
            type="button"
            className={styles.quickButton}
            onClick={() => dice.roll({ expression: `1d${sides}` })}
          >
            d{sides}
          </button>
        ))}
      </div>

      <form className={styles.inputRow} onSubmit={submit}>
        <input
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="/roll 2d6+3"
          aria-label="Команда броска"
        />
        <button type="submit" className={styles.rollButton}>
          Бросить
        </button>
      </form>

      {dice.rollError && <div className={styles.error}>{dice.rollError}</div>}

      <div className={styles.historyHeader}>
        <span>История</span>
        {dice.history.length > 0 && (
          <button type="button" className={styles.clear} onClick={dice.clearHistory}>
            Очистить
          </button>
        )}
      </div>
      {dice.history.length === 0 ? (
        <p className={styles.empty}>Бросков пока нет.</p>
      ) : (
        <ul className={styles.history}>
          {dice.history.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} detailed={dice.detailed} />
          ))}
        </ul>
      )}
    </div>
  );
}
