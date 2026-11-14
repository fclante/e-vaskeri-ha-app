import type { Machine } from '../types';

/** When this machine is expected to finish (epoch ms), or null if unknown. */
export function endMs(machine: Machine, updatedAtMs: number | null): number | null {
  if (machine.ends_at) {
    const t = Date.parse(machine.ends_at);
    if (!Number.isNaN(t)) return t;
  }
  if (machine.remaining_seconds != null && updatedAtMs != null) {
    return updatedAtMs + machine.remaining_seconds * 1000;
  }
  return null;
}

/** Whole seconds left, never negative. */
export function remainingSeconds(machine: Machine, nowMs: number, updatedAtMs: number | null): number | null {
  const end = endMs(machine, updatedAtMs);
  if (end == null) return null;
  return Math.max(0, Math.ceil((end - nowMs) / 1000));
}

/** "05:03" or "1:05:03" */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * Total cycle length is unknown, so elapsed progress is derived from the
 * largest remaining time observed while a machine was busy.
 */
export class ProgressTracker {
  private maxRemaining = new Map<number, number>();

  /** Minimum drop (seconds) before a fraction is trusted; below it the ring is indeterminate. */
  static readonly MIN_DROP = 5;

  observe(machines: Machine[], nowMs: number, updatedAtMs: number | null): void {
    const seen = new Set<number>();
    for (const machine of machines) {
      if (machine.state !== 'busy') continue;
      const remaining = remainingSeconds(machine, nowMs, updatedAtMs);
      if (remaining == null) continue;
      seen.add(machine.id);
      const prev = this.maxRemaining.get(machine.id) ?? 0;
      if (remaining > prev) this.maxRemaining.set(machine.id, remaining);
    }
    for (const id of [...this.maxRemaining.keys()]) {
      if (!seen.has(id)) this.maxRemaining.delete(id);
    }
  }

  /** Elapsed fraction 0..1, or null when it cannot be determined yet. */
  fraction(id: number, remainingSec: number | null): number | null {
    const max = this.maxRemaining.get(id);
    if (max == null || remainingSec == null || max <= 0) return null;
    if (max - remainingSec < ProgressTracker.MIN_DROP) return remainingSec === 0 ? 1 : null;
    return Math.min(1, Math.max(0, 1 - remainingSec / max));
  }

  reset(): void {
    this.maxRemaining.clear();
  }
}
