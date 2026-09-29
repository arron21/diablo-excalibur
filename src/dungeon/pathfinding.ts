import { GridCoord } from '../core/isometric';

interface Node {
  col: number;
  row: number;
  g: number;
  h: number;
  f: number;
  parent?: Node;
}

export class AStarPathfinder {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private getKey(col: number, row: number): number {
    return row * this.width + col;
  }

  findPath(
    start: GridCoord,
    goal: GridCoord,
    isWalkable: (col: number, row: number) => boolean
  ): GridCoord[] {
    if (start.col === goal.col && start.row === goal.row) {
      return [];
    }

    if (
      start.col < 0 || start.col >= this.width ||
      start.row < 0 || start.row >= this.height ||
      goal.col < 0 || goal.col >= this.width ||
      goal.row < 0 || goal.row >= this.height
    ) {
      return [];
    }

    // Heuristic: Octile distance
    const heuristic = (c1: number, r1: number, c2: number, r2: number): number => {
      const dx = Math.abs(c1 - c2);
      const dy = Math.abs(r1 - r2);
      return 10 * (dx + dy) + (14 - 2 * 10) * Math.min(dx, dy);
    };

    const openMap = new Map<number, Node>();
    const closedSet = new Set<number>();

    const startNode: Node = {
      col: start.col,
      row: start.row,
      g: 0,
      h: heuristic(start.col, start.row, goal.col, goal.row),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    const startKey = this.getKey(start.col, start.row);
    openMap.set(startKey, startNode);

    // 8 directions: [dCol, dRow, cost]
    const neighbors = [
      [0, -1, 10],  // N
      [1, 0, 10],   // E
      [0, 1, 10],   // S
      [-1, 0, 10],  // W
      [1, -1, 14],  // NE
      [1, 1, 14],   // SE
      [-1, 1, 14],  // SW
      [-1, -1, 14], // NW
    ];

    while (openMap.size > 0) {
      // Find lowest f in openMap
      let current: Node | null = null;
      let currentKey = -1;

      for (const [key, node] of openMap.entries()) {
        if (!current || node.f < current.f || (node.f === current.f && node.h < current.h)) {
          current = node;
          currentKey = key;
        }
      }

      if (!current) break;

      if (current.col === goal.col && current.row === goal.row) {
        // Reconstruct path
        const path: GridCoord[] = [];
        let curr: Node | undefined = current;
        while (curr && (curr.col !== start.col || curr.row !== start.row)) {
          path.push({ col: curr.col, row: curr.row });
          curr = curr.parent;
        }
        path.reverse();
        return path;
      }

      openMap.delete(currentKey);
      closedSet.add(currentKey);

      for (const [dc, dr, cost] of neighbors) {
        const nextCol = current.col + dc;
        const nextRow = current.row + dr;

        if (
          nextCol < 0 || nextCol >= this.width ||
          nextRow < 0 || nextRow >= this.height
        ) {
          continue;
        }

        const nextKey = this.getKey(nextCol, nextRow);
        if (closedSet.has(nextKey)) continue;

        // Diagonal corner-cutting check
        if (dc !== 0 && dr !== 0) {
          const adj1Walkable = isWalkable(current.col + dc, current.row);
          const adj2Walkable = isWalkable(current.col, current.row + dr);
          if (!adj1Walkable || !adj2Walkable) {
            continue; // Cannot cut through wall corners
          }
        }

        // Target cell walkability (allow goal cell if we are targeting an interactable/monster to get adjacent)
        const isGoal = nextCol === goal.col && nextRow === goal.row;
        if (!isGoal && !isWalkable(nextCol, nextRow)) {
          continue;
        }

        const tentativeG = current.g + cost;
        const existing = openMap.get(nextKey);

        if (!existing || tentativeG < existing.g) {
          const neighborNode: Node = {
            col: nextCol,
            row: nextRow,
            g: tentativeG,
            h: heuristic(nextCol, nextRow, goal.col, goal.row),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openMap.set(nextKey, neighborNode);
        }
      }
    }

    return []; // No path found
  }
}
