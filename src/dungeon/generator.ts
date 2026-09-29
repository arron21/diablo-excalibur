import { DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../core/constants';
import { DungeonMapData, TileType, Room, InteractiveEntity } from './dungeon-types';
import { GridCoord } from '../core/isometric';

export function generateCathedralDungeon(seed: number = Date.now()): DungeonMapData {
  const width = DUNGEON_WIDTH;
  const height = DUNGEON_HEIGHT;

  // Initialize empty grid
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TileType.EMPTY)
  );

  const rooms: Room[] = [];
  const numRooms = 6;
  const minRoomSize = 4;
  const maxRoomSize = 7;

  // Simple pseudo-random number generator
  let s = seed;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const randInt = (min: number, max: number) =>
    Math.floor(random() * (max - min + 1)) + min;

  // Generate non-overlapping rooms
  let attempts = 0;
  while (rooms.length < numRooms && attempts < 100) {
    attempts++;
    const w = randInt(minRoomSize, maxRoomSize);
    const h = randInt(minRoomSize, maxRoomSize);
    const x = randInt(2, width - w - 3);
    const y = randInt(2, height - h - 3);

    // Check overlap with existing rooms (including padding)
    let overlaps = false;
    for (const r of rooms) {
      if (
        x <= r.x + r.width + 1 &&
        x + w + 1 >= r.x &&
        y <= r.y + r.height + 1 &&
        y + h + 1 >= r.y
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      const room: Room = {
        id: rooms.length,
        x,
        y,
        width: w,
        height: h,
        centerX: Math.floor(x + w / 2),
        centerY: Math.floor(y + h / 2),
      };
      rooms.push(room);

      // Carve floor
      for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
          tiles[r][c] = TileType.FLOOR;
        }
      }
    }
  }

  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];

    let cx = r1.centerX;
    let cy = r1.centerY;

    // Horizontal corridor
    while (cx !== r2.centerX) {
      tiles[cy][cx] = TileType.FLOOR;
      cx += cx < r2.centerX ? 1 : -1;
    }
    // Vertical corridor
    while (cy !== r2.centerY) {
      tiles[cy][cx] = TileType.FLOOR;
      cy += cy < r2.centerY ? 1 : -1;
    }
    tiles[cy][cx] = TileType.FLOOR;
  }

  // Set the last room as The Butcher's Lair
  const butcherRoom = rooms[rooms.length - 1];
  butcherRoom.isButcherLair = true;
  for (let r = butcherRoom.y; r < butcherRoom.y + butcherRoom.height; r++) {
    for (let c = butcherRoom.x; c < butcherRoom.x + butcherRoom.width; c++) {
      tiles[r][c] = TileType.FLOOR_BLOOD;
    }
  }

  // Surrounding Wall placement
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (tiles[r][c] === TileType.EMPTY) {
        const hasFloorSouth = r + 1 < height && (tiles[r + 1][c] === TileType.FLOOR || tiles[r + 1][c] === TileType.FLOOR_BLOOD);
        const hasFloorEast = c + 1 < width && (tiles[r][c + 1] === TileType.FLOOR || tiles[r][c + 1] === TileType.FLOOR_BLOOD);
        const hasFloorSE = r + 1 < height && c + 1 < width && (tiles[r + 1][c + 1] === TileType.FLOOR || tiles[r + 1][c + 1] === TileType.FLOOR_BLOOD);

        if (hasFloorSouth && hasFloorEast) {
          tiles[r][c] = TileType.WALL_CORNER;
        } else if (hasFloorSouth) {
          tiles[r][c] = TileType.WALL_N;
        } else if (hasFloorEast) {
          tiles[r][c] = TileType.WALL_W;
        } else if (hasFloorSE) {
          tiles[r][c] = TileType.WALL_CORNER;
        }
      }
    }
  }

  const interactiveObjects: InteractiveEntity[] = [];
  let idCounter = 1;

  // Player spawn in Room 0
  const startRoom = rooms[0];
  const playerSpawn: GridCoord = { col: startRoom.centerX, row: startRoom.centerY };
  tiles[startRoom.centerY][startRoom.centerX] = TileType.STAIRS_UP;
  interactiveObjects.push({
    id: `stairs_up_${idCounter++}`,
    type: 'stairs',
    col: startRoom.centerX,
    row: startRoom.centerY,
    state: 'closed',
    name: 'Stairs to Tristram',
  });

  // Stairs down in Room 1 or 2
  const exitRoom = rooms[1] || rooms[0];
  const stairsDown: GridCoord = { col: exitRoom.centerX, row: exitRoom.centerY };
  tiles[exitRoom.centerY][exitRoom.centerX] = TileType.STAIRS_DOWN;
  interactiveObjects.push({
    id: `stairs_down_${idCounter++}`,
    type: 'stairs',
    col: exitRoom.centerX,
    row: exitRoom.centerY,
    state: 'closed',
    name: 'Stairs to Catacombs',
  });

  // Door at Butcher's Lair entrance
  let doorPlaced = false;
  for (let r = butcherRoom.y - 1; r <= butcherRoom.y + butcherRoom.height; r++) {
    for (let c = butcherRoom.x - 1; c <= butcherRoom.x + butcherRoom.width; c++) {
      if (r >= 0 && r < height && c >= 0 && c < width) {
        if (tiles[r][c] === TileType.FLOOR) {
          tiles[r][c] = TileType.DOOR_CLOSED;
          interactiveObjects.push({
            id: `door_butcher_${idCounter++}`,
            type: 'door',
            col: c,
            row: r,
            state: 'closed',
            name: "The Butcher's Door",
          });
          doorPlaced = true;
          break;
        }
      }
    }
    if (doorPlaced) break;
  }

  // Barrels, Chests, and Shrines in intermediate rooms
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    if (r.isButcherLair) continue;

    // Place a chest
    const chestCol = r.x + 1;
    const chestRow = r.y + 1;
    if (tiles[chestRow][chestCol] === TileType.FLOOR) {
      interactiveObjects.push({
        id: `chest_${idCounter++}`,
        type: 'chest',
        col: chestCol,
        row: chestRow,
        state: 'closed',
        name: 'Gothic Chest',
      });
    }

    // Place barrels
    const barrelCol = r.x + r.width - 2;
    const barrelRow = r.y + r.height - 2;
    if (tiles[barrelRow][barrelCol] === TileType.FLOOR) {
      interactiveObjects.push({
        id: `barrel_${idCounter++}`,
        type: 'barrel',
        col: barrelCol,
        row: barrelRow,
        state: 'closed',
        name: 'Wooden Barrel',
      });
    }

    // Place a shrine in room 2
    if (i === 2) {
      const shrineCol = r.centerX;
      const shrineRow = r.centerY;
      if (tiles[shrineRow][shrineCol] === TileType.FLOOR) {
        interactiveObjects.push({
          id: `shrine_${idCounter++}`,
          type: 'shrine',
          col: shrineCol,
          row: shrineRow,
          state: 'closed',
          name: 'Mysterious Shrine',
        });
      }
    }
  }

  // Monster Spawns
  const monsterSpawns: Array<{
    type: 'skeleton' | 'archer' | 'scavenger' | 'butcher';
    col: number;
    row: number;
  }> = [];

  // Butcher in Butcher's Lair
  monsterSpawns.push({
    type: 'butcher',
    col: butcherRoom.centerX,
    row: butcherRoom.centerY,
  });

  // Monsters in other rooms
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    if (r.isButcherLair) continue;

    // Skeletons
    monsterSpawns.push({
      type: 'skeleton',
      col: r.x + 2,
      row: r.y + 2,
    });

    // Archer
    monsterSpawns.push({
      type: 'archer',
      col: r.x + r.width - 2,
      row: r.y + 1,
    });

    // Scavenger pack
    monsterSpawns.push({
      type: 'scavenger',
      col: r.centerX - 1,
      row: r.centerY,
    });
    monsterSpawns.push({
      type: 'scavenger',
      col: r.centerX + 1,
      row: r.centerY,
    });
  }

  return {
    width,
    height,
    tiles,
    rooms,
    playerSpawn,
    stairsDown,
    stairsUp: playerSpawn,
    interactiveObjects,
    monsterSpawns,
  };
}
