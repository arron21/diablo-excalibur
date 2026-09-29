import * as ex from 'excalibur';
import { Player } from '../entities/player';
import { Monster } from '../entities/monster';
import { InteractiveObject } from '../entities/interactive';
import { GroundItemActor } from '../items/ground-items';
import { generateCathedralDungeon } from '../dungeon/generator';
import { DungeonMapData, TileType, VisibilityState } from '../dungeon/dungeon-types';
import { AStarPathfinder } from '../dungeon/pathfinding';
import { FogOfWarSystem } from '../dungeon/lighting';
import { MonsterAISystem } from '../entities/monster-ai';
import { CombatSystem } from '../combat/combat-system';
import { SpellCastingSystem } from '../spells/spells';
import { InventoryManager } from '../items/inventory';
import { generateLootItem, generateGold, UNIQUE_ITEMS } from '../items/affixes';
import { SpriteGenerator } from '../graphics/sprite-generator';
import { GridCoord, gridToWorld, gridToWorldCenter, worldToGrid, getIsoZIndex } from '../core/isometric';
import { TILE_WIDTH, TILE_HEIGHT } from '../core/constants';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';

export class DungeonScene extends ex.Scene {
  public player!: Player;
  public inventory!: InventoryManager;
  public mapData!: DungeonMapData;
  public pathfinder!: AStarPathfinder;
  public fowSystem!: FogOfWarSystem;
  public aiSystem!: MonsterAISystem;

  public monsters: Monster[] = [];
  public interactives: InteractiveObject[] = [];
  public groundItems: GroundItemActor[] = [];

  public townPortalCoord: GridCoord | null = null;
  public isAltPressed: boolean = false;
  private pointerPos: ex.Vector = ex.Vector.Zero;

  onInitialize(engine: ex.Engine): void {
    this.mapData = generateCathedralDungeon();
    this.pathfinder = new AStarPathfinder(this.mapData.width, this.mapData.height);
    this.fowSystem = new FogOfWarSystem(this.mapData.width, this.mapData.height);
    this.aiSystem = new MonsterAISystem(this.pathfinder);

    this.spawnEntities();
    this.setupInput(engine);
  }

  onActivate(): void {
    soundSynth.setScene('dungeon');
    soundSynth.startMusic();

    if (!this.player) {
      this.player = new Player(this.mapData.playerSpawn, 'warrior');
      this.add(this.player);
    } else {
      if (!this.actors.includes(this.player)) {
        this.add(this.player);
      }
      this.player.resurrect(this.mapData.playerSpawn);
    }

    this.camera.strategy.lockToActor(this.player);
    this.camera.zoom = 1.0;
  }

  private spawnEntities(): void {
    // Spawn interactive objects
    for (const data of this.mapData.interactiveObjects) {
      const obj = new InteractiveObject(data);
      this.interactives.push(obj);
      this.add(obj);
    }

    // Spawn monsters
    for (const sp of this.mapData.monsterSpawns) {
      const monster = new Monster(sp.type, { col: sp.col, row: sp.row });
      this.monsters.push(monster);
      this.add(monster);
    }
  }

  isWalkable(col: number, row: number): boolean {
    if (col < 0 || col >= this.mapData.width || row < 0 || row >= this.mapData.height) return false;
    const t = this.mapData.tiles[row][col];
    if (
      t === TileType.WALL_N ||
      t === TileType.WALL_W ||
      t === TileType.WALL_CORNER ||
      t === TileType.EMPTY
    ) {
      return false;
    }

    // Check closed door
    const door = this.interactives.find((i) => i.data.type === 'door' && i.gridPos.col === col && i.gridPos.row === row);
    if (door && door.data.state === 'closed') {
      return false;
    }

    return true;
  }

  isOpaque(col: number, row: number): boolean {
    if (col < 0 || col >= this.mapData.width || row < 0 || row >= this.mapData.height) return true;
    const t = this.mapData.tiles[row][col];
    if (
      t === TileType.WALL_N ||
      t === TileType.WALL_W ||
      t === TileType.WALL_CORNER ||
      t === TileType.EMPTY
    ) {
      return true;
    }
    const door = this.interactives.find((i) => i.data.type === 'door' && i.gridPos.col === col && i.gridPos.row === row);
    if (door && door.data.state === 'closed') {
      return true;
    }
    return false;
  }

  private setupInput(engine: ex.Engine): void {
    // Track pointer movement for hovered item nameplates
    engine.input.pointers.primary.on('move', (evt) => {
      this.pointerPos = evt.worldPos;
    });

    // Primary click (Left click): Move, Attack, Interact
    engine.input.pointers.primary.on('down', (evt) => {
      if (this.engine.currentScene !== this || this.player.playerState === 'dead') return;

      const worldPos = evt.worldPos;
      const targetGrid = worldToGrid(worldPos.x, worldPos.y);
      const isShift = engine.input.keyboard.isHeld(ex.Keys.ShiftLeft) || engine.input.keyboard.isHeld(ex.Keys.ShiftRight);

      // Shift + Click: Attack in place
      if (isShift) {
        soundSynth.playSlash();
        this.player.startAttack(targetGrid, () => {
          // Check if any monster in adjacent cell is struck
          const targetMonster = this.monsters.find(
            (m) => m.state !== 'dead' && Math.abs(m.gridPos.col - targetGrid.col) <= 1 && Math.abs(m.gridPos.row - targetGrid.row) <= 1
          );
          if (targetMonster) {
            this.handlePlayerMeleeHit(targetMonster);
          }
        });
        return;
      }

      // Check if clicked ground item
      const clickedItem = this.groundItems.find((gi) => {
        return Math.hypot(gi.pos.x - worldPos.x, gi.pos.y - worldPos.y) <= 24;
      });
      if (clickedItem) {
        const path = this.pathfinder.findPath(this.player.gridPos, clickedItem.gridPos, (c, r) => this.isWalkable(c, r));
        if (path.length > 0) {
          this.player.setPath(path);
        }
        // If close enough, pick up
        if (Math.hypot(this.player.gridPos.col - clickedItem.gridPos.col, this.player.gridPos.row - clickedItem.gridPos.row) <= 1.5) {
          this.pickupGroundItem(clickedItem);
        }
        return;
      }

      // Check if clicked monster (Attack)
      const targetMonster = this.monsters.find((m) => {
        return m.state !== 'dead' && Math.hypot(m.pos.x - worldPos.x, m.pos.y - worldPos.y) <= 24;
      });

      if (targetMonster) {
        const dist = Math.hypot(this.player.gridPos.col - targetMonster.gridPos.col, this.player.gridPos.row - targetMonster.gridPos.row);
        if (dist <= 1.5) {
          // In melee range
          soundSynth.playSlash();
          this.player.startAttack(targetMonster.gridPos, () => {
            this.handlePlayerMeleeHit(targetMonster);
          });
        } else {
          // Move towards monster
          const path = this.pathfinder.findPath(this.player.gridPos, targetMonster.gridPos, (c, r) => this.isWalkable(c, r));
          if (path.length > 0) {
            path.pop(); // Stop adjacent
            this.player.setPath(path);
          }
        }
        return;
      }

      // Check if clicked interactive object (Door, Chest, Barrel, Shrine, Stairs, Portal)
      const clickedObj = this.interactives.find((i) => {
        return Math.abs(i.gridPos.col - targetGrid.col) <= 1 && Math.abs(i.gridPos.row - targetGrid.row) <= 1;
      });

      if (clickedObj) {
        const dist = Math.hypot(this.player.gridPos.col - clickedObj.gridPos.col, this.player.gridPos.row - clickedObj.gridPos.row);
        if (dist <= 1.5) {
          this.interactWithObject(clickedObj);
        } else {
          const path = this.pathfinder.findPath(this.player.gridPos, clickedObj.gridPos, (c, r) => this.isWalkable(c, r));
          if (path.length > 0) {
            path.pop();
            this.player.setPath(path);
          }
        }
        return;
      }

      // Standard walk to floor
      if (this.isWalkable(targetGrid.col, targetGrid.row)) {
        const path = this.pathfinder.findPath(this.player.gridPos, targetGrid, (c, r) => this.isWalkable(c, r));
        if (path.length > 0) {
          this.player.setPath(path);
        }
      }
    });

    // Secondary click (Right click): Cast spell
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.engine.currentScene !== this || this.player.playerState === 'dead') return;

      const worldPos = this.engine.screen.screenToWorldCoordinates(ex.vec(e.clientX, e.clientY));
      const targetGrid = worldToGrid(worldPos.x, worldPos.y);

      soundSynth.playSpellCast(this.player.activeSpellId);

      SpellCastingSystem.castSpell(
        this.player,
        this.player.activeSpellId,
        worldPos,
        targetGrid,
        (actor) => this.add(actor),
        () => this.openTownPortal()
      );
    });

    // Keyboard hotkeys: Alt (show items), 1-4 (belt), C, I, S
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Alt') {
        this.isAltPressed = true;
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const used = this.inventory.useBeltSlot(idx, this.player);
        if (used) soundSynth.playPotion();
      } else if (e.key.toLowerCase() === 'c') {
        eventBus.emit('ui:toggleWindow', { windowName: 'character' });
      } else if (e.key.toLowerCase() === 'i') {
        eventBus.emit('ui:toggleWindow', { windowName: 'inventory' });
      } else if (e.key.toLowerCase() === 's') {
        eventBus.emit('ui:toggleWindow', { windowName: 'spellbook' });
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
        this.isAltPressed = false;
      }
    });
  }

  private handlePlayerMeleeHit(monster: Monster): void {
    const res = CombatSystem.resolvePlayerMelee(this.player, monster);
    if (res.hit) {
      soundSynth.playHit();
      eventBus.emit('combat:floatingText', {
        text: `${res.damage}${res.critical ? ' CRIT!' : ''}`,
        x: monster.pos.x,
        y: monster.pos.y - 30,
        color: res.critical ? '#facc15' : '#ffffff',
      });

      if (res.killed) {
        this.aiSystem.notifyMonsterKilled(monster, this.monsters);
        this.handleMonsterDeath(monster);
      }
    } else {
      eventBus.emit('combat:floatingText', {
        text: 'Miss',
        x: monster.pos.x,
        y: monster.pos.y - 30,
        color: '#9ca3af',
      });
    }
  }

  private handleMonsterDeath(monster: Monster): void {
    // Drop loot
    if (monster.monsterType === 'butcher') {
      soundSynth.playRoar();
      // Guaranteed drop: The Butcher's Cleaver + Gold
      this.spawnGroundItem(UNIQUE_ITEMS.butchers_cleaver, monster.gridPos);
      this.spawnGroundItem(generateGold(80, 200), { col: monster.gridPos.col + 1, row: monster.gridPos.row });
    } else {
      // 50% chance gold, 35% chance gear/potion
      if (Math.random() < 0.5) {
        this.spawnGroundItem(generateGold(10, 35), monster.gridPos);
      }
      if (Math.random() < 0.35) {
        const item = generateLootItem();
        this.spawnGroundItem(item, { col: monster.gridPos.col + (Math.random() < 0.5 ? 1 : -1), row: monster.gridPos.row });
      }
    }
  }

  private interactWithObject(obj: InteractiveObject): void {
    const outcome = obj.interact();

    switch (outcome.action) {
      case 'door_opened':
        soundSynth.playDoor();
        this.mapData.tiles[obj.gridPos.row][obj.gridPos.col] = TileType.DOOR_OPEN;
        break;

      case 'door_closed':
        soundSynth.playDoor();
        this.mapData.tiles[obj.gridPos.row][obj.gridPos.col] = TileType.DOOR_CLOSED;
        break;

      case 'barrel_smashed':
        soundSynth.playBarrel();
        if (Math.random() < 0.6) {
          const loot = Math.random() < 0.5 ? generateGold(10, 30) : generateLootItem();
          this.spawnGroundItem(loot, obj.gridPos);
        }
        break;

      case 'chest_opened':
        soundSynth.playGold();
        // Drop 2-3 items
        this.spawnGroundItem(generateGold(25, 60), obj.gridPos);
        this.spawnGroundItem(generateLootItem(), { col: obj.gridPos.col + 1, row: obj.gridPos.row });
        break;

      case 'shrine_used':
        soundSynth.playLevelUp();
        // Full heal + mana
        this.player.stats.heal(999);
        this.player.stats.restoreMana(999);
        eventBus.emit('combat:floatingText', {
          text: 'Restored by Divine Shrine!',
          x: this.player.pos.x,
          y: this.player.pos.y - 45,
          color: '#38bdf8',
        });
        break;

      case 'stairs_used':
        if (outcome.payload?.includes('Tristram')) {
          soundSynth.playHit();
          eventBus.emit('scene:change', { targetScene: 'town' });
        }
        break;

      case 'portal_used':
        soundSynth.playSpellCast('town_portal');
        eventBus.emit('scene:change', { targetScene: 'town' });
        break;
    }
  }

  public spawnGroundItem(item: any, gridPos: GridCoord): void {
    const actor = new GroundItemActor(item, gridPos);
    this.groundItems.push(actor);
    this.add(actor);
  }

  private pickupGroundItem(groundItem: GroundItemActor): void {
    const added = this.inventory.addItem(groundItem.item);
    if (added) {
      if (groundItem.item.category === 'gold') {
        soundSynth.playGold();
      } else {
        soundSynth.playGold();
      }
      eventBus.emit('item:pickup', {
        name: groundItem.item.name,
        quality: groundItem.item.quality,
      });
      eventBus.emit('combat:floatingText', {
        text: `+ ${groundItem.item.name}`,
        x: this.player.pos.x,
        y: this.player.pos.y - 45,
        color: groundItem.item.quality === 'unique' ? '#f59e0b' : groundItem.item.quality === 'magic' ? '#60a5fa' : '#ffffff',
      });

      const idx = this.groundItems.indexOf(groundItem);
      if (idx !== -1) {
        this.groundItems.splice(idx, 1);
      }
      groundItem.kill();
    } else {
      eventBus.emit('combat:floatingText', {
        text: 'Inventory Full!',
        x: this.player.pos.x,
        y: this.player.pos.y - 40,
        color: '#ef4444',
      });
    }
  }

  public openTownPortal(): void {
    if (this.townPortalCoord) return;
    this.townPortalCoord = { ...this.player.gridPos };
    const portal = new InteractiveObject({
      id: 'town_portal_instance',
      type: 'portal',
      col: this.player.gridPos.col,
      row: this.player.gridPos.row,
      state: 'open',
      name: 'Town Portal',
    });
    this.interactives.push(portal);
    this.add(portal);

    eventBus.emit('combat:floatingText', {
      text: 'Town Portal Opened!',
      x: this.player.pos.x,
      y: this.player.pos.y - 40,
      color: '#38bdf8',
    });
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    if (this.player && this.player.isInitialized) {
      // Update Fog of War
      this.fowSystem.update(
        this.player.gridPos,
        this.mapData.tiles,
        (c, r) => this.isOpaque(c, r),
        delta
      );

      // Update Monster AI
      this.aiSystem.update(
        this.monsters,
        this.player,
        (c, r) => this.isWalkable(c, r),
        (c, r) => this.isOpaque(c, r),
        delta,
        (monster, target) => {
          const res = CombatSystem.resolveMonsterAttack(monster, target);
          if (res.hit) {
            if (res.blocked) {
              soundSynth.playBlock();
              eventBus.emit('combat:floatingText', {
                text: 'Blocked!',
                x: target.pos.x,
                y: target.pos.y - 35,
                color: '#38bdf8',
              });
            } else {
              soundSynth.playHit();
              eventBus.emit('combat:floatingText', {
                text: `-${res.damage}`,
                x: target.pos.x,
                y: target.pos.y - 35,
                color: '#ef4444',
              });
            }
          }
        }
      );
    }
  }

  onPostDraw(ctx: ex.ExcaliburGraphicsContext, delta: number): void {
    // 1. Draw isometric tiles according to Fog of War visibility
    for (let r = 0; r < this.mapData.height; r++) {
      for (let c = 0; c < this.mapData.width; c++) {
        const vis = this.fowSystem.getState(c, r);
        if (vis === VisibilityState.HIDDEN) {
          continue; // Complete pitch darkness
        }

        const tileType = this.mapData.tiles[r][c];
        const canvas = SpriteGenerator.getTileSprite(tileType);
        const world = gridToWorld(c, r);

        ctx.drawImage(canvas, world.x - TILE_WIDTH / 2, world.y);

        // If previously EXPLORED (not currently VISIBLE), draw a dark shroud over it
        if (vis === VisibilityState.EXPLORED) {
          ctx.save();
          // Darken tile
          ctx.restore();
        }
      }
    }

    // 2. Draw Interactive objects (Chests, Barrels, Doors, Portal)
    for (const obj of this.interactives) {
      const vis = this.fowSystem.getState(obj.gridPos.col, obj.gridPos.row);
      if (vis !== VisibilityState.VISIBLE) continue;

      let spriteCanvas: HTMLCanvasElement | null = null;
      if (obj.data.type === 'door') {
        spriteCanvas = SpriteGenerator.getTileSprite(
          obj.data.state === 'closed' ? TileType.DOOR_CLOSED : TileType.DOOR_OPEN
        );
      } else if (obj.data.type === 'portal') {
        spriteCanvas = SpriteGenerator.getTileSprite(TileType.PORTAL);
      } else {
        spriteCanvas = SpriteGenerator.getTileSprite(TileType.BARREL);
      }

      if (spriteCanvas) {
        ctx.drawImage(spriteCanvas, obj.pos.x - spriteCanvas.width / 2, obj.pos.y - spriteCanvas.height / 2);
      }
    }

    // 3. Draw Monsters
    for (const monster of this.monsters) {
      if (monster.state === 'dead') continue;
      const vis = this.fowSystem.getState(monster.gridPos.col, monster.gridPos.row);
      if (vis !== VisibilityState.VISIBLE) continue;

      const mSprite = SpriteGenerator.getEntitySprite(
        monster.monsterType,
        monster.state,
        monster.facing,
        Math.floor(Date.now() / 150) % 4
      );
      ctx.drawImage(mSprite, monster.pos.x - mSprite.width / 2, monster.pos.y - mSprite.height * 0.85);

      // Monster Health bar
      const hpPct = monster.currentHp / monster.config.maxHp;
      const barW = monster.monsterType === 'butcher' ? 44 : 26;
      ctx.save();
      // Draw red health bar above head
      ctx.restore();
    }

    // 4. Draw Ground Items & Tooltip Labels
    for (const gi of this.groundItems) {
      const vis = this.fowSystem.getState(gi.gridPos.col, gi.gridPos.row);
      if (vis !== VisibilityState.VISIBLE) continue;

      // Item icon
      ctx.save();
      // Render item sparkle or label if Alt held or hovered
      ctx.restore();
    }

    // 5. Draw Player
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
