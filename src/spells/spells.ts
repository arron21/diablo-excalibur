import * as ex from 'excalibur';
import { Player } from '../entities/player';
import { Monster } from '../entities/monster';
import { GridCoord, gridToWorldCenter, worldToGrid, getIsoZIndex } from '../core/isometric';
import { SPELLS, SpellDefinition } from './spell-types';
import { eventBus } from '../core/events';

export class ProjectileActor extends ex.Actor {
  public damage: number;
  public spellId: string;
  private lifeTime: number = 3.0; // 3 seconds max

  constructor(
    startPos: ex.Vector,
    targetPos: ex.Vector,
    speed: number,
    damage: number,
    spellId: string
  ) {
    super({
      pos: startPos,
      width: 16,
      height: 16,
      anchor: ex.vec(0.5, 0.5),
    });

    this.damage = damage;
    this.spellId = spellId;
    const dir = targetPos.sub(startPos).normalize();
    this.vel = dir.scale(speed);
    this.z = 10000; // Always render on top of floor
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.lifeTime -= delta / 1000;
    if (this.lifeTime <= 0) {
      this.kill();
    }
  }
}

export class FireWallTileActor extends ex.Actor {
  public damage: number;
  public duration: number = 6.0;
  private tickTimer: number = 0.5;

  constructor(grid: GridCoord, damage: number) {
    const world = gridToWorldCenter(grid.col, grid.row);
    super({
      pos: ex.vec(world.x, world.y),
      width: 48,
      height: 24,
      anchor: ex.vec(0.5, 0.5),
    });
    this.damage = damage;
    this.z = getIsoZIndex(grid.col, grid.row, 0, 2);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    const dt = delta / 1000;
    this.duration -= dt;
    this.tickTimer -= dt;

    if (this.duration <= 0) {
      this.kill();
    }
  }

  canTick(): boolean {
    if (this.tickTimer <= 0) {
      this.tickTimer = 0.5;
      return true;
    }
    return false;
  }
}

export class SpellCastingSystem {
  static castSpell(
    player: Player,
    spellId: string,
    targetWorld: ex.Vector,
    targetGrid: GridCoord,
    spawnActor: (actor: ex.Actor) => void,
    onPortal?: () => void
  ): boolean {
    const spell = SPELLS[spellId];
    if (!spell) return false;

    if (player.stats.currentMana < spell.manaCost) {
      eventBus.emit('combat:floatingText', {
        text: 'Not enough mana!',
        x: player.pos.x,
        y: player.pos.y - 40,
        color: '#60a5fa',
      });
      return false;
    }

    if (player.stats.totalMagic < spell.minMagicReq) {
      eventBus.emit('combat:floatingText', {
        text: 'Need higher Magic!',
        x: player.pos.x,
        y: player.pos.y - 40,
        color: '#f87171',
      });
      return false;
    }

    const castStarted = player.startCast(targetGrid);
    if (!castStarted) return false;

    // Deduct mana
    player.stats.currentMana -= spell.manaCost;
    eventBus.emit('player:manaChanged', {
      currentMana: player.stats.currentMana,
      maxMana: player.stats.getMaxMana(),
    });

    const magic = player.stats.totalMagic;

    switch (spell.id) {
      case 'firebolt': {
        const dmg = Math.floor(8 + Math.random() * 8 + magic / 4);
        const proj = new ProjectileActor(player.pos.clone(), targetWorld, 320, dmg, 'firebolt');
        spawnActor(proj);
        break;
      }

      case 'charged_bolt': {
        // Launch 4 erratic sparks
        const baseDir = targetWorld.sub(player.pos).normalize();
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          const angle = (i * 18 * Math.PI) / 180;
          const sparkDir = ex.vec(
            baseDir.x * Math.cos(angle) - baseDir.y * Math.sin(angle),
            baseDir.x * Math.sin(angle) + baseDir.y * Math.cos(angle)
          );
          const dmg = Math.floor(4 + Math.random() * 4 + magic / 8);
          const sparkTarget = player.pos.add(sparkDir.scale(200));
          const proj = new ProjectileActor(player.pos.clone(), sparkTarget, 240, dmg, 'charged_bolt');
          spawnActor(proj);
        }
        break;
      }

      case 'firewall': {
        const dmg = Math.floor(5 + magic / 5);
        // Create 3 wall tiles around target
        for (let dc = -1; dc <= 1; dc++) {
          const tile = new FireWallTileActor(
            { col: targetGrid.col + dc, row: targetGrid.row },
            dmg
          );
          spawnActor(tile);
        }
        break;
      }

      case 'heal': {
        const healAmt = Math.floor(20 + magic * 1.2);
        const actual = player.stats.heal(healAmt);
        eventBus.emit('player:healed', {
          currentHp: player.stats.currentHp,
          maxHp: player.stats.getMaxHp(),
          amount: actual,
        });
        eventBus.emit('combat:floatingText', {
          text: `+${actual} HP`,
          x: player.pos.x,
          y: player.pos.y - 45,
          color: '#4ade80',
        });
        break;
      }

      case 'town_portal': {
        if (onPortal) {
          onPortal();
        }
        break;
      }
    }

    return true;
  }
}
