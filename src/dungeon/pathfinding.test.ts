import { describe, it, expect } from 'vitest';
import { AStarPathfinder } from './pathfinding';

describe('A* Pathfinding System', () => {
  it('finds straightforward orthogonal path', () => {
    const pf = new AStarPathfinder(10, 10);
    const path = pf.findPath({ col: 1, row: 1 }, { col: 4, row: 1 }, () => true);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 4, row: 1 });
  });

  it('navigates around a wall obstacle', () => {
    const pf = new AStarPathfinder(10, 10);
    // Wall at col 2 from row 0 to 4
    const isWalkable = (c: number, r: number) => !(c === 2 && r >= 0 && r <= 4);

    const path = pf.findPath({ col: 1, row: 2 }, { col: 3, row: 2 }, isWalkable);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 3, row: 2 });
    // Verify no waypoint was on the wall
    for (const pt of path) {
      expect(isWalkable(pt.col, pt.row)).toBe(true);
    }
  });

  it('prevents cutting corners diagonally across solid walls', () => {
    const pf = new AStarPathfinder(5, 5);
    // Wall at (1, 0) and (0, 1)
    const isWalkable = (c: number, r: number) => !( (c === 1 && r === 0) || (c === 0 && r === 1) );

    // Moving from (0, 0) to (1, 1) directly would be cutting a wall corner
    const path = pf.findPath({ col: 0, row: 0 }, { col: 1, row: 1 }, isWalkable);
    expect(path).toEqual([]); // Trapped in corner
  });

  it('returns empty array when goal is completely unreachable', () => {
    const pf = new AStarPathfinder(5, 5);
    // Surrounding walls around goal (4, 4)
    const isWalkable = (c: number, r: number) => !(c === 3 || r === 3);

    const path = pf.findPath({ col: 0, row: 0 }, { col: 4, row: 4 }, isWalkable);
    expect(path).toEqual([]);
  });
});
