import type { Timestamp } from 'firebase/firestore';

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface BaseDto {
  status: ContentStatus;
  version: number;
  updatedAt: Timestamp | null;
}

export interface SpellDto extends BaseDto {
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

export interface SchoolDto extends BaseDto {
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

export interface EffectDto extends BaseDto {
  id: string;
  name: string;
  actionType?: string;
  description?: string;
}
