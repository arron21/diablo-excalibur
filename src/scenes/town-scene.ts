import * as ex from 'excalibur';
import { Player } from '../entities/player';
import { TOWN_WIDTH, TOWN_HEIGHT, TILE_WIDTH, TILE_HEIGHT } from '../core/constants';
import { TileType } from '../dungeon/dungeon-types';
import { AStarPathfinder } from '../dungeon/pathfinding';
import { SpriteGenerator } from '../graphics/sprite-generator';
import { GridCoord, gridToWorld, gridToWorldCenter, worldToGrid, getIsoZIndex } from '../core/isometric';
import { TOWN_NPCS, NPCData } from './npcs';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';
import { InventoryManager } from '../items/inventory';

export class TownScene extends ex.Scene {
  public player!: Player;
  public inventory!: InventoryManager;
  public pathfinder!: AStarPathfinder;
  public tiles: TileType[][] = [];
  public portalSpawnCoord: GridCoord | null = null;
  public hasTownPortal: boolean = false;

  onInitialize(engine: ex.Engine): void {
    this.pathfinder = new AStarPathfinder(TOWN_WIDTH, TOWN_HEIGHT);
    this.initMap();
    this.setupInput(engine);
  }

  onActivate(): void {
    soundSynth.setScene('town');
    soundSynth.startMusic();

    // Position player at town center or portal
    const spawn = this.portalSpawnCoord || { col: 15, row: 15 };
    if (!this.player) {
      this.player = new Player(spawn, 'warrior');
      this.add(this.player);
    } else {
      this.player.resurrect(spawn);
      if (!this.actors.includes(this.player)) {
        this.add(this.player);
      }
    }

    this.camera.strategy.lockToActor(this.player);
    this.camera.zoom = 1.0;
  }

  private initMap(): void {
    this.tiles = Array.from({ length: TOWN_HEIGHT }, () =>
      Array(TOWN_WIDTH).fill(TileType.GRASS)
    );

    // Cobblestone roads & square
    for (let r = 8; r <= 22; r++) {
      for (let c = 8; c <= 22; c++) {
        this.tiles[r][c] = TileType.COBBLE;
      }
    }

    // Town Well / Fountain at center
    this.tiles[15][15] = TileType.WATER;
    this.tiles[14][15] = TileType.WATER;
    this.tiles[15][14] = TileType.WATER;
    this.tiles[14][14] = TileType.WATER;

    // Church Graveyard & Cathedral Entrance in North-East
    for (let r = 2; r <= 6; r++) {
      for (let c = 20; c <= 26; c++) {
        this.tiles[r][c] = TileType.FLOOR;
      }
    }
    this.tiles[4][24] = TileType.STAIRS_DOWN;
  }

  isWalkable(col: number, row: number): boolean {
    if (col < 0 || col >= TOWN_WIDTH || row < 0 || row >= TOWN_HEIGHT) return false;
    const t = this.tiles[row][col];
    if (t === TileType.WATER || t === TileType.WALL_N || t === TileType.WALL_W) return false;
    return true;
  }

  private setupInput(engine: ex.Engine): void {
    engine.input.pointers.primary.on('down', (evt) => {
      if (this.engine.currentScene !== this) return;

      const worldPos = evt.worldPos;
      const targetGrid = worldToGrid(worldPos.x, worldPos.y);

      // Check if clicked Church Stairs to descend
      if (targetGrid.col >= 23 && targetGrid.col <= 25 && targetGrid.row >= 3 && targetGrid.row <= 5) {
        soundSynth.playHit();
        eventBus.emit('scene:change', { targetScene: 'dungeon' });
        return;
      }

      // Check if clicked Town Portal
      if (this.hasTownPortal && this.portalSpawnCoord) {
        if (Math.abs(targetGrid.col - this.portalSpawnCoord.col) <= 1 && Math.abs(targetGrid.row - this.portalSpawnCoord.row) <= 1) {
          soundSynth.playSpellCast('town_portal');
          eventBus.emit('scene:change', { targetScene: 'dungeon' });
          return;
        }
      }

      // Check if clicked an NPC
      const clickedNpc = TOWN_NPCS.find(
        (n) => Math.abs(n.gridPos.col - targetGrid.col) <= 1 && Math.abs(n.gridPos.row - targetGrid.row) <= 1
      );

      if (clickedNpc) {
        const path = this.pathfinder.findPath(this.player.gridPos, clickedNpc.gridPos, (c, r) => this.isWalkable(c, r));
        if (path.length > 0) {
          path.pop(); // Stop adjacent to NPC
          this.player.setPath(path);
        }
        eventBus.emit('vendor:open', { npcId: clickedNpc.id });
        return;
      }

      // Standard move
      if (this.isWalkable(targetGrid.col, targetGrid.row)) {
        const path = this.pathfinder.findPath(this.player.gridPos, targetGrid, (c, r) => this.isWalkable(c, r));
        if (path.length > 0) {
          this.player.setPath(path);
        }
      }
    });
  }

  onPostDraw(ctx: ex.ExcaliburGraphicsContext, delta: number): void {
    // Draw isometric tiles
    for (let r = 0; r < TOWN_HEIGHT; r++) {
      for (let c = 0; c < TOWN_WIDTH; c++) {
        const tileType = this.tiles[r][c];
        const canvas = SpriteGenerator.getTileSprite(tileType);
        const world = gridToWorld(c, r);

        ctx.drawImage(canvas, world.x - TILE_WIDTH / 2, world.y);
      }
    }

    // Draw NPCs
    for (const npc of TOWN_NPCS) {
      const world = gridToWorldCenter(npc.gridPos.col, npc.gridPos.row);
      const sprite = SpriteGenerator.getEntitySprite('warrior', 'idle', 's');
      ctx.drawImage(sprite, world.x - sprite.width / 2, world.y - sprite.height * 0.85);

      // Name label
      ctx.save();
      // Draw text
      ctx.restore();
    }

    // Draw Town Portal if active
    if (this.hasTownPortal && this.portalSpawnCoord) {
      const pWorld = gridToWorldCenter(this.portalSpawnCoord.col, this.portalSpawnCoord.row);
      const pSprite = SpriteGenerator.getTileSprite(TileType.PORTAL);
      ctx.drawImage(pSprite, pWorld.x - TILE_WIDTH / 2, pWorld.y - TILE_HEIGHT / 2);
    }

    // Draw Player sprite
    if (this.player && this.player.isInitialized) {
      const pSprite = SpriteGenerator.getEntitySprite(
        this.player.stats.charClass,
        this.player.playerState,
        this.player.facing,
        Math.floor(Date.now() / 150) % 4
      );
      ctx.drawImage(pSprite, this.player.pos.x - pSprite.width / 2, this.player.pos.y - pSprite.height * 0.85);
    }
  }
}
