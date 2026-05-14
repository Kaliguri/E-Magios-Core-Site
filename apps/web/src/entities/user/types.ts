export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  discordUsername?: string;
  discordColor?: string;
  diceColor?: string;
  rollHistory?: RollHistoryEntry[];
}

export interface RollHistoryEntry {
  formula: string;
  result: number;
  timestamp: string;
}
