export interface Spell {
  id: string;
  name: string;
  actions?: number;
  resources?: string;
  range?: string;
  target?: string;
  duration?: string;
  school: string | string[];
  requiredLevel?: number;
  type?: string;
  damageType?: string | string[];
  damageTypeNote?: string;
  concentration?: string;
  maintenance?: string;
  source?: string;
  subspell?: string;
  signatureBonus?: string;
  description?: string;
}

export interface School {
  id: string;
  name: string;
  rarity?: string;
  difficulty?: number | string;
  properties?: string[];
  description?: string;
  principles?: string[];
  features?: string[];
  educationalSpells?: string[];
  signatureSpells?: string[];
  relatedSchools?: string[];
}

export interface Effect {
  id: string;
  name: string;
  actionType?: string;
  description?: string;
}

export interface Action {
  id: string;
  name: string;
  kind?: string;
  actions?: number;
  range?: string;
  target?: string;
  duration?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

export interface Archetype {
  id: string;
  name: string;
  description?: string;
}

export interface Basic {
  id: string;
  name: string;
  section?: string;
  page?: string;
  description?: string;
}

export interface ActionType {
  id: string;
  name: string;
  description?: string;
}

export interface CombatComponent {
  id: string;
  name: string;
  section?: string;
  page?: string;
  description?: string;
}

export interface CraftComponent {
  id: string;
  name: string;
  description?: string;
}

export interface CraftProfession {
  id: string;
  name: string;
  description?: string;
}

export interface CraftSpecialization {
  id: string;
  name: string;
  profession?: string;
  description?: string;
}

export interface RecipeType {
  id: string;
  name: string;
  description?: string;
}

export interface RecipeStep {
  name: string;
  progress: number;
}

export interface Recipe {
  id: string;
  name: string;
  profession?: string;
  specialization?: string;
  recipeLevel?: number;
  recipeRarity?: string;
  recipeCost?: string;
  recipeTypes?: string[];
  steps?: RecipeStep[];
  description?: string;
  result?: string;
}

export type CompendiumEntity =
  | Spell
  | School
  | Effect
  | Action
  | Skill
  | Archetype
  | Basic
  | ActionType
  | CombatComponent
  | CraftComponent
  | CraftProfession
  | CraftSpecialization
  | RecipeType
  | Recipe;

export type CompendiumEntityKey =
  | 'spells'
  | 'schools'
  | 'effects'
  | 'actions'
  | 'skills'
  | 'archetypes'
  | 'basics'
  | 'action-types'
  | 'combat'
  | 'craft-components'
  | 'craft-professions'
  | 'craft-specializations'
  | 'recipe-types'
  | 'recipes';
