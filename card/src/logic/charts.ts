import type { MonthStat } from '../types';

export interface Point {
  x: number;
  y: number;
}

/** Catmull-Rom spline converted to cubic béziers; monotone enough for small series. */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const f = (n: number) => Math.round(n * 100) / 100;
  let d = `M${f(points[0].x)},${f(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    // Clamp control points vertically so the curve never overshoots the data range.
    const lo = Math.min(p1.y, p2.y);
    const hi = Math.max(p1.y, p2.y);
    const cy = (y: number) => f(Math.min(hi, Math.max(lo, y)));
    d += `C${f(c1.x)},${cy(c1.y)} ${f(c2.x)},${cy(c2.y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return d;
}

export interface Sparkline {
  line: string;
  area: string;
  last: Point | null;
}

export function sparkline(values: number[], width: number, height: number, pad = 4): Sparkline {
  if (values.length === 0) return { line: '', area: '', last: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: values.length > 1 ? pad + i * stepX : width / 2,
    y: max === min ? height / 2 : height - pad - ((v - min) / span) * (height - pad * 2),
  }));
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const area = `${line}L${last.x},${height}L${points[0].x},${height}Z`;
  return { line, area, last };
}

export interface Bar {
  month: string;
  x: number;
  width: number;
  washerY: number;
  washerH: number;
  dryerY: number;
  dryerH: number;
  totalY: number;
  stat: MonthStat;
}

export interface BarChart {
  bars: Bar[];
  max: number;
  baseline: number;
  gridLines: { y: number; value: number }[];
}

/** Rounds a max value up to a "nice" axis maximum. */
export function niceMax(value: number): number {
  if (value <= 0) return 10;
  const exp = 10 ** Math.floor(Math.log10(value));
  const n = value / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

export function barChart(months: MonthStat[], width: number, height: number, top = 8, bottom = 22): BarChart {
  const data = months.slice(-12);
  const max = niceMax(Math.max(0, ...data.map((m) => m.washer_dkk + m.dryer_dkk)));
  const plotH = height - top - bottom;
  const baseline = top + plotH;
  const slot = data.length ? width / data.length : width;
  const barW = Math.max(4, Math.min(26, slot * 0.62));
  const bars = data.map((stat, i) => {
    const washerH = (stat.washer_dkk / max) * plotH;
    const dryerH = (stat.dryer_dkk / max) * plotH;
    return {
      month: stat.month,
      x: slot * i + (slot - barW) / 2,
      width: barW,
      washerY: baseline - washerH,
      washerH,
      dryerY: baseline - washerH - dryerH,
      dryerH,
      totalY: baseline - washerH - dryerH,
      stat,
    };
  });
  const gridLines = [0.5, 1].map((f) => ({ y: baseline - f * plotH, value: max * f }));
  return { bars, max, baseline, gridLines };
}

export interface DonutSegment {
  key: 'washer' | 'dryer';
  fraction: number;
  dash: number;
  offset: number;
}

export function donutSegments(washer: number, dryer: number, circumference: number, gap = 3): DonutSegment[] {
  const total = washer + dryer;
  if (total <= 0) return [];
  const parts: ['washer' | 'dryer', number][] = [
    ['washer', washer],
    ['dryer', dryer],
  ];
  let offset = 0;
  return parts
    .filter(([, v]) => v > 0)
    .map(([key, v], _i, all) => {
      const fraction = v / total;
      const g = all.length > 1 ? gap : 0;
      const seg = { key, fraction, dash: Math.max(0, fraction * circumference - g), offset: -offset };
      offset += fraction * circumference;
      return seg;
    });
}

export function topTemperature(temps: { temperature_c: number; count: number }[]): number | null {
  if (!temps.length) return null;
  return [...temps].sort((a, b) => b.count - a.count)[0].temperature_c;
}
