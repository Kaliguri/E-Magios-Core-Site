import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateStats, MAGIC_SKILLS, PERSONALITY_SKILLS } from './characterCalculations';
import { CharacterRepository } from '@/shared/repositories/CharacterRepository';
import type { Character, CharacterSkill, CharacterSpell } from '@/entities/character/types';

const AUTOSAVE_DELAY_MS = 3000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeEmptyCharacter(): Character {
  const stats = calculateStats(1);
  return {
    id: generateId(),
    name: '',
    description: '',
    level: 1,
    stats,
    magicSkills: MAGIC_SKILLS.map(s => ({ id: s.id, name: s.name, level: 0 })),
    personalitySkills: PERSONALITY_SKILLS.map(s => ({ id: s.id, name: s.name, level: 0 })),
    studySpells: [],
    signatureSpells: [],
    spontaneousSpells: [],
    schools: [],
    archetypes: [],
    currentHealth: stats.health,
    maxHealth: stats.health,
    currentWill: stats.will,
    maxWill: stats.will,
    defense: stats.evasion,
    equipment: '',
    notes: '',
  };
}

interface UseCharacterStateResult {
  character: Character;
  isDirty: boolean;
  isSaving: boolean;
  updateField: <K extends keyof Character>(key: K, value: Character[K]) => void;
  updateLevel: (level: number) => void;
  updateSkillLevel: (type: 'magic' | 'personality', skillId: string, level: number) => void;
  addSpell: (type: 'study' | 'signature' | 'spontaneous', spell: CharacterSpell) => void;
  removeSpell: (type: 'study' | 'signature' | 'spontaneous', spellId: string) => void;
  saveNow: (uid: string) => Promise<void>;
  loadCharacter: (c: Character) => void;
  reset: () => void;
}

export function useCharacterState(
  uid: string | null,
  onSaved?: () => void,
): UseCharacterStateResult {
  const [character, setCharacter] = useState<Character>(makeEmptyCharacter);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutosave = useCallback((c: Character) => {
    if (!uid || !c.name) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await CharacterRepository.saveCharacter(uid, c);
        setIsDirty(false);
        onSaved?.();
      } catch {
        // autosave failure is silent
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY_MS);
  }, [uid, onSaved]);

  const updateField = useCallback(<K extends keyof Character>(key: K, value: Character[K]) => {
    setCharacter(prev => {
      const next = { ...prev, [key]: value };
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  const updateLevel = useCallback((level: number) => {
    setCharacter(prev => {
      const clamped = Math.max(1, Math.min(20, level));
      const stats = calculateStats(clamped);
      const next = {
        ...prev,
        level: clamped,
        stats,
        maxHealth: prev.maxHealth ?? stats.health,
        currentHealth: Math.min(prev.currentHealth ?? stats.health, prev.maxHealth ?? stats.health),
        maxWill: prev.maxWill ?? stats.will,
        currentWill: Math.min(prev.currentWill ?? stats.will, prev.maxWill ?? stats.will),
        defense: prev.defense ?? stats.evasion,
      };
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  const updateSkillLevel = useCallback((type: 'magic' | 'personality', skillId: string, level: number) => {
    setCharacter(prev => {
      const field: keyof Character = type === 'magic' ? 'magicSkills' : 'personalitySkills';
      const skills = (prev[field] as CharacterSkill[]).map(s =>
        s.id === skillId ? { ...s, level: Math.max(0, Math.min(3, level)) } : s,
      );
      const next = { ...prev, [field]: skills };
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  const addSpell = useCallback((type: 'study' | 'signature' | 'spontaneous', spell: CharacterSpell) => {
    setCharacter(prev => {
      const field = type === 'study' ? 'studySpells' : type === 'signature' ? 'signatureSpells' : 'spontaneousSpells';
      const existing = prev[field] as CharacterSpell[];
      if (existing.some(s => s.id === spell.id)) return prev;
      const next = { ...prev, [field]: [...existing, spell] };
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  const removeSpell = useCallback((type: 'study' | 'signature' | 'spontaneous', spellId: string) => {
    setCharacter(prev => {
      const field = type === 'study' ? 'studySpells' : type === 'signature' ? 'signatureSpells' : 'spontaneousSpells';
      const next = { ...prev, [field]: (prev[field] as CharacterSpell[]).filter(s => s.id !== spellId) };
      setIsDirty(true);
      scheduleAutosave(next);
      return next;
    });
  }, [scheduleAutosave]);

  const saveNow = useCallback(async (uidParam: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setIsSaving(true);
    try {
      await CharacterRepository.saveCharacter(uidParam, character);
      setIsDirty(false);
      onSaved?.();
    } finally {
      setIsSaving(false);
    }
  }, [character, onSaved]);

  const loadCharacter = useCallback((c: Character) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setCharacter(c);
    setIsDirty(false);
  }, []);

  const reset = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setCharacter(makeEmptyCharacter());
    setIsDirty(false);
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  return {
    character,
    isDirty,
    isSaving,
    updateField,
    updateLevel,
    updateSkillLevel,
    addSpell,
    removeSpell,
    saveNow,
    loadCharacter,
    reset,
  };
}
