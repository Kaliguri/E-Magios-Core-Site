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
  equipment?: string;
  notes?: string;
  updatedAt?: string | null;
  version?: number;
}
