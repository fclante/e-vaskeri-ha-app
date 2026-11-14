export interface HeatmapInsight {
  weekday: number; // Monday = 0
  startHour: number;
  endHour: number;
  total: number;
}

/** Densest weekday, then the busiest consecutive 2-hour window within it. */
export function analyseHeatmap(matrix: number[][]): HeatmapInsight | null {
  let bestDay = -1;
  let bestDayTotal = 0;
  matrix.forEach((row, day) => {
    const total = row.reduce((a, b) => a + b, 0);
    if (total > bestDayTotal) {
      bestDayTotal = total;
      bestDay = day;
    }
  });
  if (bestDay < 0) return null;
  const row = matrix[bestDay];
  let bestStart = 0;
  let bestWindow = -1;
  for (let h = 0; h < Math.min(row.length, 24) - 1; h++) {
    const sum = (row[h] ?? 0) + (row[h + 1] ?? 0);
    if (sum > bestWindow) {
      bestWindow = sum;
      bestStart = h;
    }
  }
  return { weekday: bestDay, startHour: bestStart, endHour: bestStart + 2, total: bestDayTotal };
}

/** Pads/truncates to a 7 x 24 grid so rendering never has to guard. */
export function normalizeHeatmap(raw: number[][] | undefined): number[][] {
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => Math.max(0, raw?.[d]?.[h] ?? 0)),
  );
}

export function heatmapMax(matrix: number[][]): number {
  return matrix.reduce((max, row) => Math.max(max, ...row), 0);
}

/** 0..1 intensity; sqrt keeps low counts visible next to a few hot spots. */
export function heatIntensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(1, 0.18 + 0.82 * Math.sqrt(value / max));
}
