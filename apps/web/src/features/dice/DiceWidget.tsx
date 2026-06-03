import { useState, type FormEvent } from 'react';
import { useDice } from './DiceContext';
import { ROLL_TYPE_LABELS, type RollType } from './characterRollBonus';
import type { DiceHistoryEntry } from './types';
import styles from './DiceWidget.module.css';

const QUICK_DICE = [2, 4, 6, 8, 10, 12, 20, 100];
const CORE_ROLLS: { type: RollType; label: string }[] = [
  { type: 'arcana', label: ROLL_TYPE_LABELS.arcana },
  { type: 'hit', label: ROLL_TYPE_LABELS.hit },
  { type: 'apply', label: ROLL_TYPE_LABELS.apply },
];

function diceDetail(entry: DiceHistoryEntry): string {
  return entry.parts
    .filter((part) => part.kind === 'dice')
    .map((part) => (part.kind === 'dice' ? `[${part.rolls.join(', ')}]` : ''))
    .filter(Boolean)
    .join(' ');
}

function HistoryItem({ entry }: { entry: DiceHistoryEntry }) {
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
          {entry.bonus.items
            .map((item) => `${item.label} ${item.value >= 0 ? '+' : ''}${item.value}`)
            .join(', ')}
        </div>
      )}
    </li>
  );
}

export function DiceWidget() {
  const dice = useDice();
  const [input, setInput] = useState('');

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
        <button
          type="button"
          className={styles.close}
          onClick={() => dice.setOpen(false)}
          aria-label="Свернуть"
        >
          ×
        </button>
      </div>

      {dice.characters.length > 0 && (
        <div className={styles.characterRow}>
          <select
            className={styles.select}
            value={dice.selectedCharacterId ?? ''}
            onChange={(event) => dice.setSelectedCharacterId(event.target.value || null)}
          >
            <option value="">Без персонажа</option>
            {dice.characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name || 'Без имени'} (ур. {character.level})
              </option>
            ))}
          </select>
          <label
            className={styles.checkLabel}
            title="Добавлять бонусы персонажа к Аркане/Попаданию/Наложению"
          >
            <input
              type="checkbox"
              checked={dice.rollFromCharacter}
              onChange={(event) => dice.setRollFromCharacter(event.target.checked)}
            />
            Бонусы
          </label>
        </div>
      )}

      <div className={styles.coreRolls}>
        {CORE_ROLLS.map((roll) => (
          <button
            key={roll.type}
            type="button"
            className={styles.coreButton}
            onClick={() =>
              dice.roll({ expression: '1d12', rollType: roll.type, label: roll.label })
            }
          >
            {roll.label}
            <span className={styles.coreDie}>d12</span>
          </button>
        ))}
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

      {dice.discordConfigured && (
        <label className={styles.discordRow}>
          <input
            type="checkbox"
            checked={dice.sendToDiscord}
            onChange={(event) => dice.setSendToDiscord(event.target.checked)}
          />
          Дублировать броски в Discord
        </label>
      )}

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
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
