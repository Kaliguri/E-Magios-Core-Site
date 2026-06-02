// Types mirroring reports/data_report.json + the dice analytics shape produced
// by the legacy dashboard.js. Kept loose where the report is loose.

export interface ReportContentTotals {
  spells?: number;
  schools?: number;
}

export interface SpellsBySchoolRow {
  school: string;
  count: number;
}

export interface ReportContent {
  totals?: ReportContentTotals;
  spellsBySchool?: SpellsBySchoolRow[];
  concentrationShare?: number;
  subspellShare?: number;
  incompleteObjects?: number;
  schoolsWithoutSpells?: number;
  relationDensityAvg?: number;
}

export interface QualityTotals {
  error?: number;
  warning?: number;
  info?: number;
}

export interface QualityRule {
  rule: string;
  count: number;
}

export interface ReportQuality {
  totals?: QualityTotals;
  issuesByCollection?: Record<string, QualityTotals>;
  topRules?: QualityRule[];
}

export interface RollTypeStat {
  rollTypeKey: string;
  context: string;
  diceType: string;
  expression: string;
  label: string;
  count: number;
  avg: number;
  theoreticalAvg: number;
  delta: number;
  critFailRate: number;
  critSuccessRate: number;
}

export interface UserTypeStat extends RollTypeStat {
  userId: string;
  userDisplayName: string;
  critFailCount: number;
  critSuccessCount: number;
  lastRollAt: number;
}

export interface UserSummary {
  userId: string;
  userDisplayName: string;
  rollsCount: number;
  lastRollAt: number;
  avgResult: number;
  avgDeltaFromTheoretical: number;
  critFailCount: number;
  critSuccessCount: number;
  critFailRate: number;
  critSuccessRate: number;
}

export interface UserAvgVsGlobal {
  userId: string;
  userDisplayName: string;
  diceType: string;
  userAvg: number;
  globalAvg: number;
  delta: number;
  rollsCount: number;
}

export interface DiceResult {
  status: 'ok' | 'insufficient_data';
  reason: string | null;
  rollsCountByDiceType: Record<string, number>;
  avgResultByDiceType: Record<string, number>;
  theoreticalAvgByDiceType: Record<string, number>;
  avgDeltaFromTheoretical: Record<string, number>;
  critFailRate: Record<string, number>;
  critSuccessRate: Record<string, number>;
  userAvgVsGlobal: UserAvgVsGlobal[];
  userSummaries: UserSummary[];
  userTypeStats: UserTypeStat[];
  rollTypeStats: RollTypeStat[];
  topRollType: (RollTypeStat & { share?: number }) | null;
}

export interface DataReport {
  schemaVersion?: number;
  generatedAt?: string;
  quality?: ReportQuality;
  content?: ReportContent;
  dice?: Partial<DiceResult>;
}

export interface DiceEvent {
  eventId?: string;
  userId?: string;
  characterId?: string | null;
  diceType?: string;
  sides?: number;
  result?: number;
  modifier?: number;
  total?: number;
  context?: string;
  contextRollType?: string;
  contextSource?: string;
  expression?: string;
  displayExpression?: string;
  userDisplayName?: string;
  userLabel?: string;
  sessionId?: string;
  createdAt?: number;
  appVersion?: string;
}
