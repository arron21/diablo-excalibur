import { LIGHT_RADIUS_TILES, TILE_WIDTH, TILE_HEIGHT } from '../core/constants';
import { GridCoord, gridToWorld, hasLineOfSight } from '../core/isometric';
import { VisibilityState, TileType } from './dungeon-types';

export class FogOfWarSystem {
  public width: number;
  public height: number;
  public visibility: VisibilityState[][];
  private flickerOffset: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.visibility = Array.from({ length: height }, () =>
      Array(width).fill(VisibilityState.HIDDEN)
    );
  }

  reset(): void {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        this.visibility[r][c] = VisibilityState.HIDDEN;
      }
    }
  }

  revealAll(): void {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        this.visibility[r][c] = VisibilityState.VISIBLE;
      }
    }
  }

  update(
    playerPos: GridCoord,
    tiles: TileType[][],
    isDoorClosed: (col: number, row: number) => boolean,
    deltaMs: number = 16
  ): void {
    this.flickerOffset += deltaMs * 0.005;

    // Convert previously VISIBLE tiles to EXPLORED
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.visibility[r][c] === VisibilityState.VISIBLE) {
          this.visibility[r][c] = VisibilityState.EXPLORED;
        }
      }
    }

    const radius = LIGHT_RADIUS_TILES;
    const minCol = Math.max(0, playerPos.col - radius);
    const maxCol = Math.min(this.width - 1, playerPos.col + radius);
    const minRow = Math.max(0, playerPos.row - radius);
    const maxRow = Math.min(this.height - 1, playerPos.row + radius);

    const isOpaque = (c: number, r: number): boolean => {
      if (c < 0 || c >= this.width || r < 0 || r >= this.height) return true;
      const t = tiles[r][c];
      if (
        t === TileType.WALL_N ||
        t === TileType.WALL_W ||
        t === TileType.WALL_CORNER ||
        t === TileType.EMPTY
      ) {
        return true;
      }
      if (t === TileType.DOOR_CLOSED || isDoorClosed(c, r)) {
        return true;
      }
      return false;
    };

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const dist = Math.hypot(c - playerPos.col, r - playerPos.row);
        if (dist <= radius) {
          if (hasLineOfSight(playerPos, { col: c, row: r }, isOpaque)) {
            this.visibility[r][c] = VisibilityState.VISIBLE;
          }
        }
      }
    }
  }

  getState(col: number, row: number): VisibilityState {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return VisibilityState.HIDDEN;
    }
    return this.visibility[row][col];
  }

  getTorchFlicker(): number {
    return Math.sin(this.flickerOffset) * 0.05 + Math.cos(this.flickerOffset * 2.3) * 0.03;
  }
}
