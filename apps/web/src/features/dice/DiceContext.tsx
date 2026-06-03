import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import { useAuth } from '@/features/auth';
import { CharacterRepository } from '@/shared/repositories/CharacterRepository';
import type { Character } from '@/entities/character/types';
import {
  parseRollExpression,
  rollExpression,
  isCriticalRoll,
  isCriticalFail,
} from './rollExpression';
import { buildCharacterBonus, type RollType } from './characterRollBonus';
import { recordDiceEventsLocal, recordDiceRollRemote } from './diceEvents';
import { sendRollToDiscord, type DiscordConfig } from './discord';
import type { DiceHistoryEntry, RollRequest } from './types';

const HISTORY_KEY = 'react_dice_history';
const SETTINGS_KEY = 'react_dice_settings';
const MAX_HISTORY = 50;

interface DiceSettings {
  sendToDiscord: boolean;
  rollFromCharacter: boolean;
  selectedCharacterId: string | null;
}

const DEFAULT_SETTINGS: DiceSettings = {
  sendToDiscord: true,
  rollFromCharacter: true,
  selectedCharacterId: null,
};

interface DiceContextValue {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  history: DiceHistoryEntry[];
  last: DiceHistoryEntry | null;
  rollError: string | null;
  roll: (request: RollRequest) => DiceHistoryEntry | null;
  clearHistory: () => void;
  characters: Character[];
  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;
  rollFromCharacter: boolean;
  setRollFromCharacter: (value: boolean) => void;
  sendToDiscord: boolean;
  setSendToDiscord: (value: boolean) => void;
  discordConfigured: boolean;
}

const DiceContext = createContext<DiceContextValue | null>(null);

function loadHistory(): DiceHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as DiceHistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function loadSettings(): DiceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DiceSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `roll-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Append a numeric bonus to a roll expression, mirroring the legacy widget. */
function appendBonus(raw: string, bonus: number): string {
  const trimmed = raw.trim();
  const hasCommand = trimmed.toLowerCase().startsWith('/roll');
  const body = hasCommand ? trimmed.slice(5).trim() : trimmed;
  const prefix = hasCommand ? '/roll ' : '';
  const suffix = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  if (!body) return `${prefix}1d12${suffix}`;
  return `${prefix}${body}${suffix}`;
}

export function DiceProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<DiceHistoryEntry[]>(loadHistory);
  const [rollError, setRollError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [settings, setSettings] = useState<DiceSettings>(loadSettings);
  const [discord, setDiscord] = useState<DiscordConfig | null>(null);

  // Keep the latest characters/settings/discord available to the (stable) roll
  // callback without making it depend on — and re-create with — every change.
  const charactersRef = useRef(characters);
  charactersRef.current = characters;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const discordRef = useRef(discord);
  discordRef.current = discord;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // History persistence is best-effort.
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Settings persistence is best-effort.
    }
  }, [settings]);

  // Load the signed-in user's characters (for roll bonuses) and Discord config.
  useEffect(() => {
    if (!uid) {
      setCharacters([]);
      setDiscord(null);
      return;
    }
    let cancelled = false;
    void CharacterRepository.getUserCharacters(uid)
      .then((list) => {
        if (!cancelled) setCharacters(list);
      })
      .catch(() => {
        if (!cancelled) setCharacters([]);
      });
    void getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        const webhookUrl = String(data['discordWebhookUrl'] ?? '');
        setDiscord(
          webhookUrl
            ? {
                webhookUrl,
                displayName: (data['discordDisplayName'] as string) ?? null,
                color: (data['discordColor'] as string) ?? null,
              }
            : null,
        );
      })
      .catch(() => {
        if (!cancelled) setDiscord(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const roll = useCallback((request: RollRequest): DiceHistoryEntry | null => {
    setRollError(null);
    const currentSettings = settingsRef.current;
    const currentUid = uidRef.current;
    try {
      const rollType = request.rollType ?? null;
      const charId =
        request.characterId ??
        (currentSettings.rollFromCharacter ? currentSettings.selectedCharacterId : null);
      const character = charId
        ? (charactersRef.current.find((c) => c.id === charId) ?? null)
        : null;
      const wantBonus = request.applyCharacterBonus ?? true;

      const displayExpression = parseRollExpression(request.expression).expression;
      let finalRaw = request.expression;
      let bonus = null;
      if (wantBonus && rollType && character) {
        bonus = buildCharacterBonus(character, rollType);
        if (bonus.total !== 0) finalRaw = appendBonus(request.expression, bonus.total);
      }

      const result = rollExpression(parseRollExpression(finalRaw));
      const entry: DiceHistoryEntry = {
        id: makeId(),
        expression: result.expression,
        displayExpression: bonus && bonus.total !== 0 ? displayExpression : undefined,
        total: result.total,
        parts: result.parts,
        createdAt: result.createdAt,
        label: request.label ?? null,
        rollType,
        characterName: character?.name ?? null,
        spellId: request.spellId ?? null,
        isCrit: isCriticalRoll(result, rollType === 'apply'),
        isCritFail: isCriticalFail(result),
        bonus,
      };

      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
      const context = rollType ?? 'custom';
      recordDiceEventsLocal(result, { uid: currentUid, characterId: charId, context });
      if (currentUid) {
        void recordDiceRollRemote(result, {
          uid: currentUid,
          characterId: charId,
          context,
          label: request.label ?? undefined,
          rollType,
        });
      }
      if (currentSettings.sendToDiscord && discordRef.current) {
        void sendRollToDiscord(entry, discordRef.current);
      }
      setOpen(true);
      return entry;
    } catch (error) {
      setRollError(error instanceof Error ? error.message : 'Ошибка броска');
      setOpen(true);
      return null;
    }
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const setSelectedCharacterId = useCallback(
    (id: string | null) => setSettings((prev) => ({ ...prev, selectedCharacterId: id })),
    [],
  );
  const setRollFromCharacter = useCallback(
    (value: boolean) => setSettings((prev) => ({ ...prev, rollFromCharacter: value })),
    [],
  );
  const setSendToDiscord = useCallback(
    (value: boolean) => setSettings((prev) => ({ ...prev, sendToDiscord: value })),
    [],
  );

  const value = useMemo<DiceContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      history,
      last: history[0] ?? null,
      rollError,
      roll,
      clearHistory,
      characters,
      selectedCharacterId: settings.selectedCharacterId,
      setSelectedCharacterId,
      rollFromCharacter: settings.rollFromCharacter,
      setRollFromCharacter,
      sendToDiscord: settings.sendToDiscord,
      setSendToDiscord,
      discordConfigured: Boolean(discord),
    }),
    [
      open,
      toggle,
      history,
      rollError,
      roll,
      clearHistory,
      characters,
      settings,
      setSelectedCharacterId,
      setRollFromCharacter,
      setSendToDiscord,
      discord,
    ],
  );

  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}

export function useDice(): DiceContextValue {
  const ctx = useContext(DiceContext);
  if (!ctx) {
    throw new Error('useDice must be used within a DiceProvider');
  }
  return ctx;
}

export type { RollType };
