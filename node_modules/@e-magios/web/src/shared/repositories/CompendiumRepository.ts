import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/firebase/client';
import type {
  Spell, School, Effect, Action, Skill,
  Archetype, Basic, ActionType, CombatComponent,
  CraftComponent, CraftProfession, CraftSpecialization,
  RecipeType, Recipe,
} from '@/entities/compendium/types';
import {
  spellFromJson, schoolFromJson, effectFromJson,
  actionFromJson, skillFromJson, archetypeFromJson,
  basicFromJson, actionTypeFromJson, combatComponentFromJson,
  craftComponentFromJson, craftProfessionFromJson,
  craftSpecializationFromJson, recipeTypeFromJson, recipeFromJson,
} from '@/entities/compendium/mappers';

const BASE_URL = import.meta.env.BASE_URL;

async function fetchJson<T>(
  path: string,
  mapper: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  const url = `${BASE_URL}data/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const json = await res.json() as Record<string, unknown>[];
  return json.map(mapper);
}

async function fetchFromFirestore<T>(
  collectionName: string,
  mapper: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  const col = collection(db, collectionName);
  const q = query(col, where('status', '==', 'published'));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapper({ id: d.id, ...d.data() } as Record<string, unknown>));
}

async function fetchWithFallback<T>(
  collectionName: string,
  jsonFile: string,
  mapper: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  try {
    return await fetchFromFirestore(collectionName, mapper);
  } catch {
    return fetchJson(jsonFile, mapper);
  }
}

export const CompendiumRepository = {
  async getSpells(): Promise<Spell[]> {
    return fetchWithFallback('spells', 'spells.json', spellFromJson);
  },

  async getSchools(): Promise<School[]> {
    return fetchWithFallback('schools', 'schools.json', schoolFromJson);
  },

  async getEffects(): Promise<Effect[]> {
    return fetchWithFallback('effects', 'effects.json', effectFromJson);
  },

  async getActions(): Promise<Action[]> {
    return fetchWithFallback('actions', 'actions.json', actionFromJson);
  },

  async getSkills(): Promise<Skill[]> {
    return fetchWithFallback('skills', 'skills.json', skillFromJson);
  },

  async getArchetypes(): Promise<Archetype[]> {
    return fetchWithFallback('archetypes', 'archetypes.json', archetypeFromJson);
  },

  async getBasics(): Promise<Basic[]> {
    return fetchWithFallback('basics', 'basics.json', basicFromJson);
  },

  async getActionTypes(): Promise<ActionType[]> {
    return fetchWithFallback('action_types', 'action_types.json', actionTypeFromJson);
  },

  async getCombatComponents(): Promise<CombatComponent[]> {
    return fetchWithFallback('combat_components', 'combat_components.json', combatComponentFromJson);
  },

  async getCraftComponents(): Promise<CraftComponent[]> {
    return fetchWithFallback('craft_components', 'craft_components.json', craftComponentFromJson);
  },

  async getCraftProfessions(): Promise<CraftProfession[]> {
    return fetchWithFallback('craft_professions', 'craft_professions.json', craftProfessionFromJson);
  },

  async getCraftSpecializations(): Promise<CraftSpecialization[]> {
    return fetchWithFallback('craft_specializations', 'craft_specializations.json', craftSpecializationFromJson);
  },

  async getRecipeTypes(): Promise<RecipeType[]> {
    return fetchWithFallback('recipe_types', 'recipe_types.json', recipeTypeFromJson);
  },

  async getRecipes(): Promise<Recipe[]> {
    return fetchWithFallback('recipes', 'recipes.json', recipeFromJson);
  },
};
