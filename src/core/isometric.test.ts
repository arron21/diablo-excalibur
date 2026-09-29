import { describe, it, expect } from 'vitest';
import {
  gridToWorld,
  worldToGrid,
  getIsoZIndex,
  getDirection,
  hasLineOfSight,
} from './isometric';

describe('Isometric Coordinate Math', () => {
  it('correctly maps grid (0, 0) to world (0, 0)', () => {
    const world = gridToWorld(0, 0);
    expect(world.x).toBe(0);
    expect(world.y).toBe(0);
  });

  it('correctly rounds trips grid coordinates to world and back', () => {
    const coords = [
      { col: 5, row: 5 },
      { col: 10, row: 2 },
      { col: 3, row: 8 },
      { col: 0, row: 12 },
    ];

    for (const c of coords) {
      const world = gridToWorld(c.col, c.row);
      // Sample center of diamond: x, y + halfH
      const recovered = worldToGrid(world.x, world.y + 16);
      expect(recovered.col).toBe(c.col);
      expect(recovered.row).toBe(c.row);
    }
  });

  it('calculates proper isometric depth z-index', () => {
    const topTileZ = getIsoZIndex(0, 0);
    const bottomTileZ = getIsoZIndex(10, 10);
    expect(bottomTileZ).toBeGreaterThan(topTileZ);
  });

  it('calculates 8-direction headings', () => {
    expect(getDirection({ col: 5, row: 5 }, { col: 5, row: 3 })).toBe('n');
    expect(getDirection({ col: 5, row: 5 }, { col: 5, row: 7 })).toBe('s');
    expect(getDirection({ col: 5, row: 5 }, { col: 7, row: 5 })).toBe('e');
    expect(getDirection({ col: 5, row: 5 }, { col: 3, row: 5 })).toBe('w');
  });

  it('calculates line of sight without obstruction', () => {
    const clear = hasLineOfSight({ col: 2, row: 2 }, { col: 6, row: 2 }, () => false);
    expect(clear).toBe(true);
  });

  it('detects line of sight obstruction', () => {
    const blocked = hasLineOfSight(
      { col: 2, row: 2 },
      { col: 6, row: 2 },
      (c, r) => c === 4 && r === 2
    );
    expect(blocked).toBe(false);
  });
});
