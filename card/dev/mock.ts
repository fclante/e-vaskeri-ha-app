import machinesJson from '../../sample_data/machines.json';
import balanceJson from '../../sample_data/balance.json';
import statementJson from '../../sample_data/statement.json';
import statsJson from '../../sample_data/stats.json';
import type { HassEntity, HomeAssistant, MachineState } from '../src/types';

export const MACHINES_ENTITY = 'sensor.e_vaskeri_machines_overview';
export const ACCOUNT_ENTITY = 'sensor.e_vaskeri_account_overview';
export const SERVER_TZ = 'Europe/Copenhagen';

interface RawMachine {
  id: number;
  name: string;
  type: string;
  state: MachineState;
  raw_status: string | null;
  program: string | null;
  step: string | null;
  remaining_seconds: number | null;
  ends_at: string | null;
}

export interface MockMachine extends RawMachine {
  endsAtMs: number | null;
}

export interface MockModel {
  machines: MockMachine[];
}

export interface MockOptions {
  now: number;
  language?: string;
  timeFormat?: '12' | '24';
  /** Entities report "unavailable". */
  unavailable?: boolean;
  /** Entities are not part of the registry/state machine at all. */
  missing?: boolean;
  /** Age of the integration's last successful poll, in seconds. */
  dataAgeSec?: number;
}

/** Builds a mutable model from the sample payloads, anchored at `now`. */
export function createModel(now: number): MockModel {
  const machines = (machinesJson.machines as RawMachine[]).map((m) => ({
    ...m,
    endsAtMs: m.state === 'busy' && m.remaining_seconds != null ? now + m.remaining_seconds * 1000 : null,
  }));
  return { machines };
}

const PROGRAMS: Record<string, [string, string]> = {
  washer: ['40° Mild', 'Hovedvask'],
  dryer: ['Program 14, ExtraTørt, 55°C', 'Tørrer'],
  mangle: ['Strygning', 'Kører'],
};

export function setMachineState(model: MockModel, id: number, state: MachineState, now: number): void {
  const m = model.machines.find((x) => x.id === id);
  if (!m || m.state === state) return;
  m.state = state;
  if (state === 'busy') {
    m.endsAtMs = now + 25 * 60 * 1000;
    [m.program, m.step] = PROGRAMS[m.type] ?? PROGRAMS.washer;
  } else {
    m.endsAtMs = null;
    m.step = null;
    m.program = state === 'done' ? (m.program ?? PROGRAMS[m.type]?.[0] ?? null) : null;
  }
  m.raw_status = { free: 'Fri', busy: 'OPTAGET', done: 'FÆRDIG', error: 'FEJL', unknown: '?' }[state];
}

export function buildMachineAttributes(model: MockModel, opts: MockOptions) {
  const updatedMs = opts.now - (opts.dataAgeSec ?? 0) * 1000;
  const machines = model.machines.map((m) => {
    let state = m.state;
    let endsAt: string | null = null;
    let remaining: number | null = null;
    if (state === 'busy' && m.endsAtMs != null) {
      // A real poll would report the machine as finished once the timer ran out.
      if (m.endsAtMs <= updatedMs) state = 'done';
      else {
        endsAt = new Date(m.endsAtMs).toISOString();
        remaining = Math.round((m.endsAtMs - updatedMs) / 1000);
      }
    }
    const idle = state === 'free';
    return {
      id: m.id,
      name: m.name,
      type: m.type,
      state,
      raw_status: m.raw_status,
      program: idle ? null : m.program,
      step: state === 'busy' ? m.step : null,
      remaining_seconds: state === 'done' ? 0 : remaining,
      ends_at: endsAt,
      entity_id: `sensor.vaskemaskine_${m.id}_status`,
    };
  });
  const by_type: Record<string, { total: number; free: number; busy: number }> = {};
  for (const m of machines) {
    const c = (by_type[m.type] ??= { total: 0, free: 0, busy: 0 });
    c.total++;
    if (m.state === 'free') c.free++;
    if (m.state === 'busy') c.busy++;
  }
  const busy = machines.filter((m) => m.state === 'busy' && m.ends_at);
  busy.sort((a, b) => Date.parse(a.ends_at!) - Date.parse(b.ends_at!));
  const upstream = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SERVER_TZ,
  }).format(updatedMs);
  return {
    location: machinesJson.location,
    updated_at: new Date(updatedMs).toISOString(),
    upstream_updated: upstream,
    summary: {
      total: machines.length,
      free: machines.filter((m) => m.state === 'free').length,
      busy: machines.filter((m) => m.state === 'busy').length,
      by_type,
      next_free: busy[0] ? { id: busy[0].id, name: busy[0].name, ends_at: busy[0].ends_at } : null,
    },
    machines,
  };
}

export function buildAccountAttributes(opts: MockOptions) {
  return {
    ...balanceJson,
    updated_at: new Date(opts.now).toISOString(),
    stats: statsJson,
    recent: statementJson.entries.slice(0, 12),
  };
}

function entity(entity_id: string, state: string, attributes: Record<string, unknown>): HassEntity {
  return { entity_id, state, attributes };
}

export function buildHass(model: MockModel, opts: MockOptions): HomeAssistant {
  const states: Record<string, HassEntity> = {};
  const entities: HomeAssistant['entities'] = {};
  if (!opts.missing) {
    const attrs = buildMachineAttributes(model, opts);
    entities![MACHINES_ENTITY] = {
      entity_id: MACHINES_ENTITY,
      platform: 'e_vaskeri',
      translation_key: 'machines_overview',
    };
    entities![ACCOUNT_ENTITY] = {
      entity_id: ACCOUNT_ENTITY,
      platform: 'e_vaskeri',
      translation_key: 'account_overview',
    };
    if (opts.unavailable) {
      states[MACHINES_ENTITY] = entity(MACHINES_ENTITY, 'unavailable', {});
      states[ACCOUNT_ENTITY] = entity(ACCOUNT_ENTITY, 'unavailable', {});
    } else {
      states[MACHINES_ENTITY] = entity(MACHINES_ENTITY, String(attrs.summary.free), attrs);
      states[ACCOUNT_ENTITY] = entity(ACCOUNT_ENTITY, String(balanceJson.balance_dkk), buildAccountAttributes(opts));
    }
  }
  const language = opts.language ?? 'da';
  return {
    states,
    entities,
    language,
    locale: { language, number_format: 'language', time_format: opts.timeFormat ?? '24', time_zone: 'server' },
    config: { time_zone: SERVER_TZ },
  };
}
