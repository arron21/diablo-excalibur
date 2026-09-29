import { TILE_WIDTH, TILE_HEIGHT, ELEVATION_STEP } from './constants';

export interface GridCoord {
  col: number;
  row: number;
}

export interface WorldCoord {
  x: number;
  y: number;
}

export type Direction8 = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const DIRECTION_OFFSETS: Record<Direction8, GridCoord> = {
  n:  { col:  0, row: -1 },
  ne: { col:  1, row: -1 },
  e:  { col:  1, row:  0 },
  se: { col:  1, row:  1 },
  s:  { col:  0, row:  1 },
  sw: { col: -1, row:  1 },
  w:  { col: -1, row:  0 },
  nw: { col: -1, row: -1 },
};

/**
 * Converts a grid coordinate (col, row) to world pixel coordinate (top-center of diamond).
 */
export function gridToWorld(col: number, row: number, elevation: number = 0): WorldCoord {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const x = (col - row) * halfW;
  const y = (col + row) * halfH - elevation * ELEVATION_STEP;
  return { x, y };
}

/**
 * Converts a grid coordinate to the visual center of the isometric tile.
 */
export function gridToWorldCenter(col: number, row: number, elevation: number = 0): WorldCoord {
  const world = gridToWorld(col, row, elevation);
  return {
    x: world.x,
    y: world.y + TILE_HEIGHT / 2
  };
}

/**
 * Converts world pixel coordinates (x, y) to the corresponding grid cell (col, row).
 */
export function worldToGrid(x: number, y: number, elevation: number = 0): GridCoord {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const adjustedY = y + elevation * ELEVATION_STEP;

  const col = Math.floor((x / halfW + adjustedY / halfH) / 2);
  const row = Math.floor((adjustedY / halfH - x / halfW) / 2);

  return { col, row };
}

/**
 * Calculates depth z-index for rendering order based on isometric coordinates.
 */
export function getIsoZIndex(col: number, row: number, elevation: number = 0, layerOffset: number = 0): number {
  return (col + row) * 20 + elevation * 5 + layerOffset;
}

/**
 * Calculates Euclidean grid distance between two cells.
 */
export function getGridDistance(a: GridCoord, b: GridCoord): number {
  const dc = a.col - b.col;
  const dr = a.row - b.row;
  return Math.sqrt(dc * dc + dr * dr);
}

/**
 * Calculates Chebyshev distance (maximum of delta col and delta row), ideal for 8-way steps.
 */
export function getChebyshevDistance(a: GridCoord, b: GridCoord): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

/**
 * Computes closest 8-directional facing heading from source to target.
 */
export function getDirection(from: GridCoord, to: GridCoord): Direction8 {
  const dc = to.col - from.col;
  const dr = to.row - from.row;
  if (dc === 0 && dr === 0) return 's';

  // In isometric projection:
  // +col is down-right (screen +X, +Y)
  // -col is up-left (-X, -Y)
  // +row is down-left (-X, +Y)
  // -row is up-right (+X, -Y)
  const angle = Math.atan2(dr, dc) * (180 / Math.PI); // -180 to 180
  
  if (angle >= -22.5 && angle < 22.5) return 'e';
  if (angle >= 22.5 && angle < 67.5) return 'se';
  if (angle >= 67.5 && angle < 112.5) return 's';
  if (angle >= 112.5 && angle < 157.5) return 'sw';
  if (angle >= 157.5 || angle < -157.5) return 'w';
  if (angle >= -157.5 && angle < -112.5) return 'nw';
  if (angle >= -112.5 && angle < -67.5) return 'n';
  return 'ne';
}

/**
 * Supercover / Bresenham raycasting line-of-sight between two grid cells.
 */
export function hasLineOfSight(
  start: GridCoord,
  end: GridCoord,
  isOpaque: (col: number, row: number) => boolean
): boolean {
  let x0 = start.col;
  let y0 = start.row;
  const x1 = end.col;
  const y1 = end.row;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (x0 !== x1 || y0 !== y1) {
    if ((x0 !== start.col || y0 !== start.row) && isOpaque(x0, y0)) {
      return false;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return true;
}
