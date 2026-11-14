export const MIN_TILE = 128;
export const TILE_GAP = 10;

/** How many tiles of at least MIN_TILE fit in a row of `width` px. */
export function maxColumns(width: number, minTile = MIN_TILE, gap = TILE_GAP): number {
  if (!(width > 0)) return 3;
  return Math.max(1, Math.floor((width + gap) / (minTile + gap)));
}

/** Pixel width of one tile when `maxCols` columns share `width` px. */
export function tileWidth(width: number, maxCols: number, gap = TILE_GAP): number {
  return Math.floor((width - gap * (maxCols - 1)) / maxCols);
}

/**
 * Column count for a group of `count` tiles that avoids a lone orphan tile:
 * fewest rows first, then fewest empty cells, then the widest layout.
 */
export function balancedColumns(count: number, maxCols: number): number {
  if (count <= 0) return 1;
  let best = Math.min(count, maxCols);
  let bestRows = Math.ceil(count / best);
  let bestEmpty = bestRows * best - count;
  for (let cols = Math.min(count, maxCols); cols >= 1; cols--) {
    const rows = Math.ceil(count / cols);
    const empty = rows * cols - count;
    if (rows < bestRows || (rows === bestRows && empty < bestEmpty)) {
      best = cols;
      bestRows = rows;
      bestEmpty = empty;
    }
  }
  return best;
}
