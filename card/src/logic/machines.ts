import type { Machine, MachinesOverview, MachineType, TypeCounts } from '../types';
import { endMs, remainingSeconds } from './countdown';
import type { Translate } from '../localize';

export const TYPE_ORDER: MachineType[] = ['washer', 'dryer', 'mangle', 'other'];
export const STALE_AFTER_MS = 2 * 60 * 1000;

export type Connection = 'live' | 'stale' | 'unavailable';

export function staleAgeMinutes(updatedAt: number | null, nowMs: number): number | null {
  if (updatedAt == null) return null;
  return Math.max(0, Math.floor((nowMs - updatedAt) / 60000));
}

export function isStale(updatedAt: number | null, nowMs: number): boolean {
  return updatedAt != null && nowMs - updatedAt > STALE_AFTER_MS;
}

export function connectionStatus(overview: MachinesOverview | null, nowMs: number): Connection {
  if (!overview || !overview.available) return 'unavailable';
  return isStale(overview.updatedAt, nowMs) ? 'stale' : 'live';
}

export function filterTypes(machines: Machine[], allowed: MachineType[] | undefined): Machine[] {
  return allowed && allowed.length ? machines.filter((m) => allowed.includes(m.type)) : machines;
}

export interface MachineGroup {
  type: MachineType;
  machines: Machine[];
  counts: TypeCounts;
}

export function groupMachines(machines: Machine[]): MachineGroup[] {
  return TYPE_ORDER.map((type) => {
    const list = machines.filter((m) => m.type === type).sort((a, b) => a.id - b.id);
    return {
      type,
      machines: list,
      counts: {
        total: list.length,
        free: list.filter((m) => m.state === 'free').length,
        busy: list.filter((m) => m.state === 'busy').length,
      },
    };
  }).filter((g) => g.machines.length > 0);
}

export interface NextFinish {
  machine: Machine;
  seconds: number;
}

/** Busy machine that finishes first, optionally restricted to a type. */
export function nextFinish(
  machines: Machine[],
  nowMs: number,
  updatedAt: number | null,
  type?: MachineType,
): NextFinish | null {
  let best: NextFinish | null = null;
  for (const machine of machines) {
    if (machine.state !== 'busy' || (type && machine.type !== type)) continue;
    if (endMs(machine, updatedAt) == null) continue;
    const seconds = remainingSeconds(machine, nowMs, updatedAt) ?? 0;
    if (!best || seconds < best.seconds) best = { machine, seconds };
  }
  return best;
}

export function formatDuration(t: Translate, seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (seconds < 30) return t('lessThanMin');
  if (minutes < 60) return t('min', { n: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? t('hour', { h }) : t('hourMin', { h, m });
}

/** "Vaskemaskine 3" in the card language, independent of the language the API used. */
export function machineName(t: Translate, machine: Pick<Machine, 'type' | 'id' | 'name'>): string {
  return machine.type === 'other' ? machine.name : `${t(`type_${machine.type}`)} ${machine.id}`;
}

/** Localizes API unit labels such as "Dryer 11". */
export function localizeUnitLabel(t: Translate, label: string): string {
  const m = /^(washer|dryer|mangle)\s+(\d+)$/i.exec(label.trim());
  return m ? `${t(`type_${m[1].toLowerCase() as MachineType}`)} ${m[2]}` : label;
}
