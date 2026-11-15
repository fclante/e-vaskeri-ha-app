import type { AccountOverview, HomeAssistant, Machine, MachinesOverview, MachinesSummary, MachineState, MachineType, Stats, StatementEntry } from '../types';
import { fixMojibake } from './format';

export const PLATFORM = 'e_vaskeri';

export interface Discovered {
  machinesEntity: string | null;
  accountEntity: string | null;
}

export interface DiscoveryConfig {
  machines_entity?: string;
  account_entity?: string;
}

/** Finds the hub entities via the entity registry (platform + translation_key). */
export function discoverEntities(hass: HomeAssistant | undefined, config: DiscoveryConfig = {}): Discovered {
  const find = (key: string): string | null => {
    for (const entry of Object.values(hass?.entities ?? {})) {
      if (entry.platform === PLATFORM && entry.translation_key === key) return entry.entity_id;
    }
    return null;
  };
  return {
    machinesEntity: config.machines_entity || find('machines_overview'),
    accountEntity: config.account_entity || find('account_overview'),
  };
}

const MACHINE_TYPES: MachineType[] = ['washer', 'dryer', 'mangle', 'other'];
const MACHINE_STATES: MachineState[] = ['free', 'busy', 'done', 'error', 'unknown'];

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseIso(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function parseMachine(raw: unknown): Machine | null {
  if (!isRecord(raw)) return null;
  const id = num(raw.id);
  if (id == null) return null;
  const type = MACHINE_TYPES.includes(raw.type as MachineType) ? (raw.type as MachineType) : 'other';
  const state = MACHINE_STATES.includes(raw.state as MachineState) ? (raw.state as MachineState) : 'unknown';
  const clean = (v: unknown) => {
    const s = str(v);
    return s ? fixMojibake(s) : null;
  };
  return {
    id,
    name: clean(raw.name) ?? `#${id}`,
    type,
    state,
    raw_status: clean(raw.raw_status),
    // Upstream text may have lost the degree sign before reaching Home Assistant.
    program: clean(raw.program)?.replace(/\b(\d{1,3})\uFFFD(?=C\b|\s|$)/g, '$1°') ?? null,
    step: clean(raw.step),
    remaining_seconds: num(raw.remaining_seconds),
    ends_at: str(raw.ends_at),
    entity_id: str(raw.entity_id),
  };
}

export function computeSummary(machines: Machine[]): MachinesSummary {
  const by_type: MachinesSummary['by_type'] = {};
  for (const m of machines) {
    const counts = (by_type[m.type] ??= { total: 0, free: 0, busy: 0 });
    counts.total++;
    if (m.state === 'free') counts.free++;
    if (m.state === 'busy') counts.busy++;
  }
  const free = machines.filter((m) => m.state === 'free').length;
  const busy = machines.filter((m) => m.state === 'busy').length;
  return { total: machines.length, free, busy, by_type, next_free: null };
}

function parseSummary(raw: unknown, machines: Machine[]): MachinesSummary {
  const computed = computeSummary(machines);
  if (!isRecord(raw)) return computed;
  const by_type: MachinesSummary['by_type'] = {};
  if (isRecord(raw.by_type)) {
    for (const type of MACHINE_TYPES) {
      const c = raw.by_type[type];
      if (isRecord(c) && num(c.total) != null) {
        by_type[type] = { total: num(c.total)!, free: num(c.free) ?? 0, busy: num(c.busy) ?? 0 };
      }
    }
  }
  const nf = raw.next_free;
  return {
    total: num(raw.total) ?? computed.total,
    free: num(raw.free) ?? computed.free,
    busy: num(raw.busy) ?? computed.busy,
    by_type: Object.keys(by_type).length ? by_type : computed.by_type,
    next_free: isRecord(nf) && num(nf.id) != null
      ? { id: num(nf.id)!, name: str(nf.name) ?? `#${nf.id}`, ends_at: str(nf.ends_at) }
      : null,
  };
}

export function isUnavailableState(state: string | undefined): boolean {
  return state === undefined || state === 'unavailable' || state === 'unknown';
}

export function readMachines(hass: HomeAssistant | undefined, entityId: string | null): MachinesOverview | null {
  if (!entityId) return null;
  const entity = hass?.states?.[entityId];
  if (!entity) return null;
  const attrs = entity.attributes ?? {};
  const machines = (Array.isArray(attrs.machines) ? attrs.machines : [])
    .map(parseMachine)
    .filter((m): m is Machine => m !== null)
    .sort((a, b) => a.id - b.id);
  return {
    available: !isUnavailableState(entity.state) && machines.length > 0,
    location: str(attrs.location),
    updatedAt: parseIso(attrs.updated_at),
    upstreamUpdated: str(attrs.upstream_updated),
    summary: parseSummary(attrs.summary, machines),
    machines,
  };
}

function parseStats(raw: unknown): Stats | null {
  if (!isRecord(raw)) return null;
  const months = (Array.isArray(raw.months) ? raw.months : [])
    .filter(isRecord)
    .map((m) => ({
      month: str(m.month) ?? '',
      washer_dkk: num(m.washer_dkk) ?? 0,
      dryer_dkk: num(m.dryer_dkk) ?? 0,
      total_dkk: num(m.total_dkk) ?? (num(m.washer_dkk) ?? 0) + (num(m.dryer_dkk) ?? 0),
    }))
    .filter((m) => m.month);
  const t = raw.totals;
  const fav = raw.favourite_machine;
  return {
    months,
    totals: isRecord(t)
      ? {
          washer_dkk: num(t.washer_dkk) ?? 0,
          dryer_dkk: num(t.dryer_dkk) ?? 0,
          total_dkk: num(t.total_dkk) ?? 0,
          washes: num(t.washes) ?? 0,
          dries: num(t.dries) ?? 0,
        }
      : null,
    current_month_spend_dkk: num(raw.current_month_spend_dkk),
    avg_cost_per_wash_dkk: num(raw.avg_cost_per_wash_dkk),
    avg_cost_per_dry_dkk: num(raw.avg_cost_per_dry_dkk),
    favourite_machine: isRecord(fav) && str(fav.name) ? { name: str(fav.name)!, count: num(fav.count) ?? 0 } : null,
    top_programs: (Array.isArray(raw.top_programs) ? raw.top_programs : [])
      .filter(isRecord)
      .map((p) => ({ program: (p.program as string | number) ?? '', count: num(p.count) ?? 0 })),
    top_temperatures: (Array.isArray(raw.top_temperatures) ? raw.top_temperatures : [])
      .filter(isRecord)
      .filter((p) => num(p.temperature_c) != null)
      .map((p) => ({ temperature_c: num(p.temperature_c)!, count: num(p.count) ?? 0 })),
    heatmap: Array.isArray(raw.heatmap)
      ? raw.heatmap.map((row) => (Array.isArray(row) ? row.map((v) => num(v) ?? 0) : []))
      : [],
  };
}

function parseEntry(raw: unknown): StatementEntry | null {
  if (!isRecord(raw) || !str(raw.date)) return null;
  return {
    date: str(raw.date)!,
    time: str(raw.time),
    kind: raw.kind === 'payment' ? 'payment' : 'usage',
    unit_id: num(raw.unit_id),
    unit_type: str(raw.unit_type),
    unit_label: str(raw.unit_label),
    description: str(raw.description) ? fixMojibake(str(raw.description)!) : null,
    program: (raw.program as string | number | null) ?? null,
    temperature_c: num(raw.temperature_c),
    duration_min: num(raw.duration_min),
    amount_dkk: num(raw.amount_dkk) ?? 0,
  };
}

export function readAccount(hass: HomeAssistant | undefined, entityId: string | null): AccountOverview | null {
  if (!entityId) return null;
  const entity = hass?.states?.[entityId];
  if (!entity) return null;
  const a = entity.attributes ?? {};
  const stateNum = Number(entity.state);
  const balance = num(a.balance_dkk) ?? (Number.isFinite(stateNum) && entity.state !== '' ? stateNum : null);
  const lp = a.last_payment;
  return {
    available: !isUnavailableState(entity.state) && balance != null,
    balance,
    currency: str(a.currency) ?? 'DKK',
    previousPeriod: num(a.previous_period_dkk),
    owed: num(a.owed_dkk),
    lastPayment: isRecord(lp) && str(lp.date)
      ? { date: str(lp.date)!, amount_dkk: num(lp.amount_dkk) ?? 0, description: str(lp.description) ? fixMojibake(str(lp.description)!) : null }
      : null,
    updatedAt: parseIso(a.updated_at),
    stats: parseStats(a.stats),
    recent: (Array.isArray(a.recent) ? a.recent : []).map(parseEntry).filter((e): e is StatementEntry => e !== null),
  };
}
