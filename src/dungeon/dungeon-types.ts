import { GridCoord } from '../core/isometric';

export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL_N = 2,
  WALL_W = 3,
  WALL_CORNER = 4,
  DOOR_CLOSED = 5,
  DOOR_OPEN = 6,
  STAIRS_DOWN = 7,
  STAIRS_UP = 8,
  BARREL = 9,
  CHEST_CLOSED = 10,
  CHEST_OPEN = 11,
  SHRINE = 12,
  PORTAL = 13,
  FLOOR_BLOOD = 14,
  GRASS = 15,
  COBBLE = 16,
  WATER = 17,
  TOWN_WALL = 18,
}

export enum VisibilityState {
  HIDDEN = 0,
  EXPLORED = 1,
  VISIBLE = 2,
}

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  isButcherLair?: boolean;
}

export interface InteractiveEntity {
  id: string;
  type: 'door' | 'chest' | 'barrel' | 'shrine' | 'portal' | 'stairs';
  col: number;
  row: number;
  state: 'closed' | 'open' | 'smashed' | 'used';
  name: string;
}

export interface DungeonMapData {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  playerSpawn: GridCoord;
  stairsDown: GridCoord;
  stairsUp?: GridCoord;
  interactiveObjects: InteractiveEntity[];
  monsterSpawns: Array<{
    type: 'skeleton' | 'archer' | 'scavenger' | 'butcher';
    col: number;
    row: number;
  }>;
}
