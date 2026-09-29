import * as ex from 'excalibur';
import { GridCoord, Direction8, gridToWorldCenter, worldToGrid, getDirection, getIsoZIndex } from '../core/isometric';
import { CharacterStats, CharacterClass } from './stats';
import { eventBus } from '../core/events';

export type PlayerState = 'idle' | 'walk' | 'attack' | 'cast' | 'hurt' | 'dead';

export class Player extends ex.Actor {
  public gridPos: GridCoord;
  public facing: Direction8 = 's';
  public playerState: PlayerState = 'idle';
  public stats: CharacterStats;

  public pathWaypoints: GridCoord[] = [];
  public moveSpeed: number = 140; // Pixels per second
  private targetWorldPos: ex.Vector | null = null;

  public attackCooldown: number = 0;
  public attackDuration: number = 0.35; // 350ms swing
  public castCooldown: number = 0;
  public castDuration: number = 0.45;
  public hurtTimer: number = 0;

  public activeSpellId: string = 'firebolt';
  public isShiftAttacking: boolean = false;
  public attackTargetCallback?: () => void;

  constructor(gridPos: GridCoord, charClass: CharacterClass = 'warrior') {
    const world = gridToWorldCenter(gridPos.col, gridPos.row);
    super({
      name: 'Player',
      pos: ex.vec(world.x, world.y),
      width: 32,
      height: 48,
      anchor: ex.vec(0.5, 0.85),
    });

    this.gridPos = { ...gridPos };
    this.stats = new CharacterStats(charClass);
    this.z = getIsoZIndex(this.gridPos.col, this.gridPos.row, 0, 5);
  }

  setPath(waypoints: GridCoord[]): void {
    if (this.playerState === 'dead' || this.playerState === 'hurt') return;
    this.pathWaypoints = [...waypoints];
    if (this.pathWaypoints.length > 0) {
      this.playerState = 'walk';
      this.startNextWaypoint();
    }
  }

  stopMoving(): void {
    this.pathWaypoints = [];
    this.targetWorldPos = null;
    if (this.playerState === 'walk') {
      this.playerState = 'idle';
    }
  }

  private startNextWaypoint(): void {
    if (this.pathWaypoints.length === 0) {
      this.playerState = 'idle';
      this.targetWorldPos = null;
      return;
    }

    const nextGrid = this.pathWaypoints.shift()!;
    this.facing = getDirection(this.gridPos, nextGrid);
    this.gridPos = { ...nextGrid };
    const worldCenter = gridToWorldCenter(nextGrid.col, nextGrid.row);
    this.targetWorldPos = ex.vec(worldCenter.x, worldCenter.y);
    this.z = getIsoZIndex(this.gridPos.col, this.gridPos.row, 0, 5);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    const dt = delta / 1000;

    // Cooldown timers
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0 && this.playerState === 'attack') {
        this.playerState = 'idle';
        if (this.attackTargetCallback) {
          this.attackTargetCallback();
          this.attackTargetCallback = undefined;
        }
      }
    }

    if (this.castCooldown > 0) {
      this.castCooldown -= dt;
      if (this.castCooldown <= 0 && this.playerState === 'cast') {
        this.playerState = 'idle';
      }
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0 && this.playerState === 'hurt') {
        this.playerState = 'idle';
      }
    }

    // Movement update
    if (this.playerState === 'walk' && this.targetWorldPos) {
      const dirVec = this.targetWorldPos.sub(this.pos);
      const dist = dirVec.size;
      const step = this.moveSpeed * dt;

      if (dist <= step) {
        this.pos = this.targetWorldPos.clone();
        this.startNextWaypoint();
      } else {
        this.pos = this.pos.add(dirVec.normalize().scale(step));
        // Keep z-index aligned with current visual position
        const currentGrid = worldToGrid(this.pos.x, this.pos.y);
        this.z = getIsoZIndex(currentGrid.col, currentGrid.row, 0, 5);
      }
    }
  }

  startAttack(targetGrid?: GridCoord, onHit?: () => void): boolean {
    if (this.attackCooldown > 0 || this.playerState === 'dead') return false;

    this.stopMoving();
    if (targetGrid) {
      this.facing = getDirection(this.gridPos, targetGrid);
    }
    this.playerState = 'attack';
    this.attackCooldown = this.attackDuration;
    this.attackTargetCallback = onHit;
    return true;
  }

  startCast(targetGrid: GridCoord): boolean {
    if (this.castCooldown > 0 || this.playerState === 'dead') return false;

    this.stopMoving();
    this.facing = getDirection(this.gridPos, targetGrid);
    this.playerState = 'cast';
    this.castCooldown = this.castDuration;
    return true;
  }

  receiveDamage(amount: number): boolean {
    if (this.playerState === 'dead') return false;

    const isDead = this.stats.takeDamage(amount);
    eventBus.emit('player:damaged', {
      currentHp: this.stats.currentHp,
      maxHp: this.stats.getMaxHp(),
      damage: amount,
    });

    if (isDead) {
      this.playerState = 'dead';
      this.stopMoving();
      return true;
    } else if (amount >= this.stats.getMaxHp() * 0.15) {
      // Hit recovery trigger
      this.playerState = 'hurt';
      this.hurtTimer = 0.25;
      this.stopMoving();
    }
    return false;
  }

  resurrect(gridPos: GridCoord): void {
    this.playerState = 'idle';
    this.gridPos = { ...gridPos };
    const world = gridToWorldCenter(gridPos.col, gridPos.row);
    this.pos = ex.vec(world.x, world.y);
    this.stats.currentHp = this.stats.getMaxHp();
    this.stats.currentMana = this.stats.getMaxMana();
    this.z = getIsoZIndex(gridPos.col, gridPos.row, 0, 5);
    eventBus.emit('player:statsChanged', undefined);
  }
}
