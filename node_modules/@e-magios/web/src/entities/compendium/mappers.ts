import type { Spell, School, Effect, Action, Skill, Archetype, Basic, ActionType, CombatComponent, CraftComponent, CraftProfession, CraftSpecialization, RecipeType, Recipe } from './types';
import type { SpellDto, SchoolDto, EffectDto } from './dto';

export function spellFromDto(dto: SpellDto): Spell {
  const { status: _s, version: _v, updatedAt: _u, ...rest } = dto;
  return rest;
}

export function schoolFromDto(dto: SchoolDto): School {
  const { status: _s, version: _v, updatedAt: _u, ...rest } = dto;
  return rest;
}

export function effectFromDto(dto: EffectDto): Effect {
  const { status: _s, version: _v, updatedAt: _u, ...rest } = dto;
  return rest;
}

export function spellFromJson(raw: Record<string, unknown>): Spell {
  return raw as unknown as Spell;
}

export function schoolFromJson(raw: Record<string, unknown>): School {
  return raw as unknown as School;
}

export function effectFromJson(raw: Record<string, unknown>): Effect {
  return raw as unknown as Effect;
}

export function actionFromJson(raw: Record<string, unknown>): Action {
  return raw as unknown as Action;
}

export function skillFromJson(raw: Record<string, unknown>): Skill {
  return raw as unknown as Skill;
}

export function archetypeFromJson(raw: Record<string, unknown>): Archetype {
  return raw as unknown as Archetype;
}

export function basicFromJson(raw: Record<string, unknown>): Basic {
  return raw as unknown as Basic;
}

export function actionTypeFromJson(raw: Record<string, unknown>): ActionType {
  return raw as unknown as ActionType;
}

export function combatComponentFromJson(raw: Record<string, unknown>): CombatComponent {
  return raw as unknown as CombatComponent;
}

export function craftComponentFromJson(raw: Record<string, unknown>): CraftComponent {
  return raw as unknown as CraftComponent;
}

export function craftProfessionFromJson(raw: Record<string, unknown>): CraftProfession {
  return raw as unknown as CraftProfession;
}

export function craftSpecializationFromJson(raw: Record<string, unknown>): CraftSpecialization {
  return raw as unknown as CraftSpecialization;
}

export function recipeTypeFromJson(raw: Record<string, unknown>): RecipeType {
  return raw as unknown as RecipeType;
}

export function recipeFromJson(raw: Record<string, unknown>): Recipe {
  return raw as unknown as Recipe;
}
