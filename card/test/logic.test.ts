import { describe, expect, it } from 'vitest';
import { ProgressTracker, endMs, remainingSeconds } from '../src/logic/countdown';
import { analyseHeatmap, heatIntensity, normalizeHeatmap } from '../src/logic/heatmap';
import { balancedColumns, maxColumns } from '../src/logic/layout';
import { isStale, staleAgeMinutes, connectionStatus, groupMachines, nextFinish } from '../src/logic/machines';
import { barChart, donutSegments, niceMax, smoothPath } from '../src/logic/charts';
import type { Machine } from '../src/types';

const NOW = Date.parse('2026-11-13T21:50:00Z');

const machine = (over: Partial<Machine>): Machine => ({
  id: 1,
  name: 'Vaskemaskine 1',
  type: 'washer',
  state: 'busy',
  raw_status: null,
  program: null,
  step: null,
  remaining_seconds: null,
  ends_at: null,
  entity_id: null,
  ...over,
});

describe('remaining time', () => {
  it('counts down from ends_at and rounds up', () => {
    const m = machine({ ends_at: new Date(NOW + 61_500).toISOString() });
    expect(remainingSeconds(m, NOW, null)).toBe(62);
    expect(remainingSeconds(m, NOW + 30_000, null)).toBe(32);
  });
  it('never goes negative', () => {
    const m = machine({ ends_at: new Date(NOW - 5_000).toISOString() });
    expect(remainingSeconds(m, NOW, null)).toBe(0);
  });
  it('falls back to remaining_seconds relative to updated_at', () => {
    const m = machine({ remaining_seconds: 600 });
    expect(endMs(m, NOW - 60_000)).toBe(NOW + 540_000);
    expect(remainingSeconds(m, NOW, NOW - 60_000)).toBe(540);
  });
  it('is unknown without any timing data', () => {
    expect(remainingSeconds(machine({}), NOW, null)).toBeNull();
  });
});

describe('ProgressTracker', () => {
  const busy = (remaining: number) => machine({ ends_at: new Date(NOW + remaining * 1000).toISOString() });

  it('is indeterminate when a machine was only just seen', () => {
    const t = new ProgressTracker();
    t.observe([busy(1800)], NOW, null);
    expect(t.fraction(1, 1800)).toBeNull();
  });
  it('derives elapsed fraction from the largest remaining time seen', () => {
    const t = new ProgressTracker();
    t.observe([busy(1800)], NOW, null);
    expect(t.fraction(1, 900)).toBeCloseTo(0.5);
    expect(t.fraction(1, 0)).toBe(1);
  });
  it('resets when the machine is no longer busy', () => {
    const t = new ProgressTracker();
    t.observe([busy(1800)], NOW, null);
    t.observe([machine({ state: 'free' })], NOW, null);
    t.observe([busy(600)], NOW, null);
    expect(t.fraction(1, 300)).toBeCloseTo(0.5);
  });
  it('grows the maximum if the end time is extended', () => {
    const t = new ProgressTracker();
    t.observe([busy(600)], NOW, null);
    t.observe([busy(1200)], NOW, null);
    expect(t.fraction(1, 600)).toBeCloseTo(0.5);
  });
});

describe('stale detection', () => {
  it('flags data older than two minutes', () => {
    expect(isStale(NOW - 119_000, NOW)).toBe(false);
    expect(isStale(NOW - 121_000, NOW)).toBe(true);
    expect(isStale(null, NOW)).toBe(false);
  });
  it('reports the age in whole minutes', () => {
    expect(staleAgeMinutes(NOW - 5 * 60_000 - 20_000, NOW)).toBe(5);
  });
  it('derives the connection status', () => {
    const base = {
      available: true,
      location: null,
      updatedAt: NOW - 1000,
      upstreamUpdated: null,
      summary: { total: 0, free: 0, busy: 0, by_type: {}, next_free: null },
      machines: [],
    };
    expect(connectionStatus(base, NOW)).toBe('live');
    expect(connectionStatus({ ...base, updatedAt: NOW - 300_000 }, NOW)).toBe('stale');
    expect(connectionStatus({ ...base, available: false }, NOW)).toBe('unavailable');
    expect(connectionStatus(null, NOW)).toBe('unavailable');
  });
});

describe('machine helpers', () => {
  const machines = [
    machine({ id: 9, type: 'dryer', state: 'free' }),
    machine({ id: 2, state: 'busy', ends_at: new Date(NOW + 900_000).toISOString() }),
    machine({ id: 1, state: 'busy', ends_at: new Date(NOW + 300_000).toISOString() }),
    machine({ id: 10, type: 'dryer', state: 'busy', ends_at: new Date(NOW + 100_000).toISOString() }),
  ];
  it('groups by type, sorted by id', () => {
    const groups = groupMachines(machines);
    expect(groups.map((g) => g.type)).toEqual(['washer', 'dryer']);
    expect(groups[0].machines.map((m) => m.id)).toEqual([1, 2]);
    expect(groups[1].counts).toEqual({ total: 2, free: 1, busy: 1 });
  });
  it('finds the next machine to finish, optionally per type', () => {
    expect(nextFinish(machines, NOW, null)?.machine.id).toBe(10);
    expect(nextFinish(machines, NOW, null, 'washer')?.machine.id).toBe(1);
    expect(nextFinish(machines, NOW, null, 'mangle')).toBeNull();
  });
});

describe('heatmap', () => {
  const grid = normalizeHeatmap([]);
  it('finds the densest weekday and its best two-hour window', () => {
    grid[5][10] = 4;
    grid[5][11] = 6;
    grid[5][12] = 1;
    grid[2][8] = 3;
    expect(analyseHeatmap(grid)).toEqual({ weekday: 5, startHour: 10, endHour: 12, total: 11 });
  });
  it('returns null without data', () => {
    expect(analyseHeatmap(normalizeHeatmap([]))).toBeNull();
  });
  it('pads malformed matrices to 7 x 24', () => {
    const m = normalizeHeatmap([[1, 2]]);
    expect(m).toHaveLength(7);
    expect(m[0]).toHaveLength(24);
    expect(m[0][1]).toBe(2);
  });
  it('maps counts to a monotonic intensity', () => {
    expect(heatIntensity(0, 10)).toBe(0);
    expect(heatIntensity(1, 10)).toBeLessThan(heatIntensity(5, 10));
    expect(heatIntensity(10, 10)).toBe(1);
  });
});

describe('layout', () => {
  it('avoids orphan tiles', () => {
    expect(balancedColumns(8, 7)).toBe(4);
    expect(balancedColumns(3, 7)).toBe(3);
    expect(balancedColumns(1, 7)).toBe(1);
    expect(balancedColumns(8, 3)).toBe(3);
  });
  it('derives the column count from the width', () => {
    expect(maxColumns(0)).toBe(3);
    expect(maxColumns(300)).toBe(2);
    expect(maxColumns(920)).toBe(6);
  });
});

describe('chart maths', () => {
  it('rounds axis maxima up to nice values', () => {
    expect(niceMax(224)).toBe(250);
    expect(niceMax(87)).toBe(100);
    expect(niceMax(0)).toBe(10);
  });
  it('stacks washer below dryer inside the plot area', () => {
    const { bars, baseline } = barChart([{ month: '2026-11', washer_dkk: 50, dryer_dkk: 50, total_dkk: 100 }], 100, 100);
    expect(bars[0].washerY + bars[0].washerH).toBeCloseTo(baseline);
    expect(bars[0].dryerY + bars[0].dryerH).toBeCloseTo(bars[0].washerY);
  });
  it('keeps only the latest 12 months', () => {
    const months = Array.from({ length: 15 }, (_, i) => ({ month: `2026-${i}`, washer_dkk: 1, dryer_dkk: 1, total_dkk: 2 }));
    expect(barChart(months, 300, 100).bars).toHaveLength(12);
  });
  it('splits the donut proportionally', () => {
    const segs = donutSegments(75, 25, 100, 0);
    expect(segs.map((s) => s.dash)).toEqual([75, 25]);
    expect(donutSegments(0, 0, 100)).toEqual([]);
  });
  it('builds a smooth path', () => {
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 10 }])).toMatch(/^M0,0C/);
    expect(smoothPath([])).toBe('');
  });
});
