export type MachineType = 'washer' | 'dryer' | 'mangle' | 'other';
export type MachineState = 'free' | 'busy' | 'done' | 'error' | 'unknown';
export type Section = 'machines' | 'balance' | 'spend' | 'heatmap' | 'activity';
export type Lang = 'da' | 'en';

export interface EntityRegistryDisplayEntry {
  entity_id: string;
  platform?: string;
  translation_key?: string;
  device_id?: string;
  name?: string | null;
  hidden?: boolean;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated?: string;
}

export interface HassLocale {
  language: string;
  number_format?: string;
  time_format?: string;
  time_zone?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  entities?: Record<string, EntityRegistryDisplayEntry>;
  locale?: HassLocale;
  language?: string;
  config?: { time_zone?: string };
  themes?: { darkMode?: boolean };
}

export interface LovelaceCardConfig {
  type: string;
  title?: string;
  show?: Section[];
  compact?: boolean;
  machine_types?: MachineType[];
  language?: string;
  machines_entity?: string;
  account_entity?: string;
}

export interface Machine {
  id: number;
  name: string;
  type: MachineType;
  state: MachineState;
  raw_status: string | null;
  program: string | null;
  step: string | null;
  remaining_seconds: number | null;
  ends_at: string | null;
  entity_id: string | null;
}

export interface TypeCounts {
  total: number;
  free: number;
  busy: number;
}

export interface NextFree {
  id: number;
  name: string;
  ends_at: string | null;
}

export interface MachinesSummary {
  total: number;
  free: number;
  busy: number;
  by_type: Partial<Record<MachineType, TypeCounts>>;
  next_free: NextFree | null;
}

export interface MachinesOverview {
  available: boolean;
  location: string | null;
  updatedAt: number | null;
  upstreamUpdated: string | null;
  summary: MachinesSummary;
  machines: Machine[];
}

export interface MonthStat {
  month: string;
  washer_dkk: number;
  dryer_dkk: number;
  total_dkk: number;
}

export interface Stats {
  months: MonthStat[];
  totals: { washer_dkk: number; dryer_dkk: number; total_dkk: number; washes: number; dries: number } | null;
  current_month_spend_dkk: number | null;
  avg_cost_per_wash_dkk: number | null;
  avg_cost_per_dry_dkk: number | null;
  favourite_machine: { name: string; count: number } | null;
  top_programs: { program: string | number; count: number }[];
  top_temperatures: { temperature_c: number; count: number }[];
  heatmap: number[][];
}

export interface StatementEntry {
  date: string;
  time: string | null;
  kind: 'usage' | 'payment';
  unit_id: number | null;
  unit_type: string | null;
  unit_label: string | null;
  description: string | null;
  program: string | number | null;
  temperature_c: number | null;
  duration_min: number | null;
  amount_dkk: number;
}

export interface AccountOverview {
  available: boolean;
  balance: number | null;
  currency: string;
  previousPeriod: number | null;
  owed: number | null;
  lastPayment: { date: string; amount_dkk: number; description: string | null } | null;
  updatedAt: number | null;
  stats: Stats | null;
  recent: StatementEntry[];
}
