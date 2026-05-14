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

async function fetchPublished<T>(
  collectionName: string,
  mapper: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  const col = collection(db, collectionName);
  const q = query(col, where('status', '==', 'published'));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapper({ id: d.id, ...d.data() } as Record<string, unknown>));
}

export const CompendiumRepository = {
  async getSpells(): Promise<Spell[]> {
    return fetchPublished('spells', spellFromJson);
  },

  async getSchools(): Promise<School[]> {
    return fetchPublished('schools', schoolFromJson);
  },

  async getEffects(): Promise<Effect[]> {
    return fetchPublished('effects', effectFromJson);
  },

  async getActions(): Promise<Action[]> {
    return fetchPublished('actions', actionFromJson);
  },

  async getSkills(): Promise<Skill[]> {
    return fetchPublished('skills', skillFromJson);
  },

  async getArchetypes(): Promise<Archetype[]> {
    return fetchPublished('archetypes', archetypeFromJson);
  },

  async getBasics(): Promise<Basic[]> {
    return fetchPublished('basics', basicFromJson);
  },

  async getActionTypes(): Promise<ActionType[]> {
    return fetchPublished('action_types', actionTypeFromJson);
  },

  async getCombatComponents(): Promise<CombatComponent[]> {
    return fetchPublished('combat_components', combatComponentFromJson);
  },

  async getCraftComponents(): Promise<CraftComponent[]> {
    return fetchPublished('craft_components', craftComponentFromJson);
  },

  async getCraftProfessions(): Promise<CraftProfession[]> {
    return fetchPublished('craft_professions', craftProfessionFromJson);
  },

  async getCraftSpecializations(): Promise<CraftSpecialization[]> {
    return fetchPublished('craft_specializations', craftSpecializationFromJson);
  },

  async getRecipeTypes(): Promise<RecipeType[]> {
    return fetchPublished('recipe_types', recipeTypeFromJson);
  },

  async getRecipes(): Promise<Recipe[]> {
    return fetchPublished('recipes', recipeFromJson);
  },
};
