import { CompendiumRepository } from '@/shared/repositories/CompendiumRepository';
import type { CompendiumEntity, CompendiumEntityKey } from './types';
import type { EntitySchema } from './schema';
import { COMPENDIUM_SCHEMAS } from './schema';
import type { FilterState } from '@/features/db/useCompendiumFilters';

export interface CompendiumConfig {
  key: CompendiumEntityKey;
  label: string;
  collectionName: string;
  jsonFile: string;
  manifestKey: string;
  schema: EntitySchema;
  fetcher: () => Promise<CompendiumEntity[]>;
  defaultFilters?: FilterState;
}

export const COMPENDIUM_CONFIGS: CompendiumConfig[] = [
  {
    key: 'spells',
    label: 'Заклинания',
    collectionName: 'spells',
    jsonFile: 'spells.json',
    manifestKey: 'spells',
    schema: COMPENDIUM_SCHEMAS.spells,
    fetcher: () => CompendiumRepository.getSpells(),
    defaultFilters: { subspell: ['Нет'] },
  },
  {
    key: 'schools',
    label: 'Школы Магии',
    collectionName: 'schools',
    jsonFile: 'schools.json',
    manifestKey: 'schools',
    schema: COMPENDIUM_SCHEMAS.schools,
    fetcher: () => CompendiumRepository.getSchools(),
  },
  {
    key: 'effects',
    label: 'Эффекты',
    collectionName: 'effects',
    jsonFile: 'effects.json',
    manifestKey: 'effects',
    schema: COMPENDIUM_SCHEMAS.effects,
    fetcher: () => CompendiumRepository.getEffects(),
  },
  {
    key: 'actions',
    label: 'Действия',
    collectionName: 'actions',
    jsonFile: 'actions.json',
    manifestKey: 'actions',
    schema: COMPENDIUM_SCHEMAS.actions,
    fetcher: () => CompendiumRepository.getActions(),
  },
  {
    key: 'skills',
    label: 'Навыки',
    collectionName: 'skills',
    jsonFile: 'skills.json',
    manifestKey: 'skills',
    schema: COMPENDIUM_SCHEMAS.skills,
    fetcher: () => CompendiumRepository.getSkills(),
  },
  {
    key: 'archetypes',
    label: 'Архетипы',
    collectionName: 'archetypes',
    jsonFile: 'archetypes.json',
    manifestKey: 'archetypes',
    schema: COMPENDIUM_SCHEMAS.archetypes,
    fetcher: () => CompendiumRepository.getArchetypes(),
  },
  {
    key: 'basics',
    label: 'Базовые',
    collectionName: 'basics',
    jsonFile: 'basics.json',
    manifestKey: 'basics',
    schema: COMPENDIUM_SCHEMAS.basics,
    fetcher: () => CompendiumRepository.getBasics(),
  },
  {
    key: 'action-types',
    label: 'Типы Действий',
    collectionName: 'action_types',
    jsonFile: 'action_types.json',
    manifestKey: 'action_types',
    schema: COMPENDIUM_SCHEMAS['action-types'],
    fetcher: () => CompendiumRepository.getActionTypes(),
  },
  {
    key: 'combat',
    label: 'Боевые',
    collectionName: 'combat_components',
    jsonFile: 'combat_components.json',
    manifestKey: 'combat_components',
    schema: COMPENDIUM_SCHEMAS.combat,
    fetcher: () => CompendiumRepository.getCombatComponents(),
  },
  {
    key: 'craft-components',
    label: 'Компоненты крафта',
    collectionName: 'craft_components',
    jsonFile: 'craft_components.json',
    manifestKey: 'craft_components',
    schema: COMPENDIUM_SCHEMAS['craft-components'],
    fetcher: () => CompendiumRepository.getCraftComponents(),
  },
  {
    key: 'craft-professions',
    label: 'Профессии',
    collectionName: 'craft_professions',
    jsonFile: 'craft_professions.json',
    manifestKey: 'craft_professions',
    schema: COMPENDIUM_SCHEMAS['craft-professions'],
    fetcher: () => CompendiumRepository.getCraftProfessions(),
  },
  {
    key: 'craft-specializations',
    label: 'Специализации',
    collectionName: 'craft_specializations',
    jsonFile: 'craft_specializations.json',
    manifestKey: 'craft_specializations',
    schema: COMPENDIUM_SCHEMAS['craft-specializations'],
    fetcher: () => CompendiumRepository.getCraftSpecializations(),
  },
  {
    key: 'recipe-types',
    label: 'Типы рецептов',
    collectionName: 'recipe_types',
    jsonFile: 'recipe_types.json',
    manifestKey: 'recipe_types',
    schema: COMPENDIUM_SCHEMAS['recipe-types'],
    fetcher: () => CompendiumRepository.getRecipeTypes(),
  },
  {
    key: 'recipes',
    label: 'Рецепты',
    collectionName: 'recipes',
    jsonFile: 'recipes.json',
    manifestKey: 'recipes',
    schema: COMPENDIUM_SCHEMAS.recipes,
    fetcher: () => CompendiumRepository.getRecipes(),
  },
];

export const COMPENDIUM_CONFIG_BY_KEY = Object.fromEntries(
  COMPENDIUM_CONFIGS.map(config => [config.key, config]),
) as Record<CompendiumEntityKey, CompendiumConfig>;

export function isCompendiumKey(value: string | null): value is CompendiumEntityKey {
  return Boolean(value && value in COMPENDIUM_CONFIG_BY_KEY);
}
