export interface CharacterSpell {
  id: string;
  name: string;
  source?: string;
  school?: string;
  type?: string;
}

export interface CharacterSkill {
  id: string;
  name: string;
  level: number;
}

export interface CharacterBonus {
  id: string;
  name: string;
  value: number;
}

export interface CharacterStats {
  level: number;
  arcana: number;
  health: number;
  will: number;
  speed: number;
  initiative: number;
  hitBonus: number;
  effectBonus: number;
  evasion: number;
  fortitude: number;
  actions: number;
  reactions: number;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  level: number;
  stats: CharacterStats;
  magicSkills: CharacterSkill[];
  personalitySkills: CharacterSkill[];
  studySpells: CharacterSpell[];
  signatureSpells: CharacterSpell[];
  spontaneousSpells: CharacterSpell[];
  schools: string[];
  archetypes: string[];
  currentHealth?: number;
  maxHealth?: number;
  currentWill?: number;
  maxWill?: number;
  defense?: number;
  equipment?: string;
  notes?: string;
  // Temporary bonuses (tab "Бонусы")
  temporaryBonuses?: CharacterBonus[];
  // Inventory (tab "Инвентарь")
  inventory?: string;
  // Crafting (tab "Ремесло")
  professions?: string;
  recipes?: string;
  // Description (tab "Описание")
  alignment?: string;
  gender?: string;
  race?: string;
  appearance?: string;
  relationships?: string;
  misc?: string;
  updatedAt?: string | null;
  version?: number;
}
