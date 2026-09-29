import * as ex from 'excalibur';
import { GridCoord, Direction8, gridToWorldCenter, worldToGrid, getDirection, getIsoZIndex } from '../core/isometric';

export type MonsterType = 'skeleton' | 'archer' | 'scavenger' | 'butcher';
export type MonsterState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'hurt' | 'dead';

export interface MonsterConfig {
  type: MonsterType;
  name: string;
  maxHp: number;
  ac: number;
  toHit: number;
  dmgMin: number;
  dmgMax: number;
  speed: number;
  xp: number;
  attackRange: number;
  attackSpeed: number; // seconds per attack
  fleeHpRatio?: number;
}

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  skeleton: {
    type: 'skeleton',
    name: 'Skeleton Warrior',
    maxHp: 25,
    ac: 12,
    toHit: 55,
    dmgMin: 3,
    dmgMax: 8,
    speed: 75,
    xp: 35,
    attackRange: 1.5,
    attackSpeed: 1.0,
  },
  archer: {
    type: 'archer',
    name: 'Skeleton Archer',
    maxHp: 18,
    ac: 8,
    toHit: 60,
    dmgMin: 2,
    dmgMax: 6,
    speed: 80,
    xp: 40,
    attackRange: 6.0,
    attackSpeed: 1.4,
  },
  scavenger: {
    type: 'scavenger',
    name: 'Fallen Scavenger',
    maxHp: 14,
    ac: 6,
    toHit: 45,
    dmgMin: 2,
    dmgMax: 5,
    speed: 105,
    xp: 22,
    attackRange: 1.4,
    attackSpeed: 0.8,
    fleeHpRatio: 0.4,
  },
  butcher: {
    type: 'butcher',
    name: 'The Butcher',
    maxHp: 180,
    ac: 18,
    toHit: 75,
    dmgMin: 8,
    dmgMax: 16,
    speed: 120,
    xp: 450,
    attackRange: 1.6,
    attackSpeed: 0.85,
  },
};

export class Monster extends ex.Actor {
  public monsterType: MonsterType;
  public config: MonsterConfig;
  public currentHp: number;
  public gridPos: GridCoord;
  public facing: Direction8 = 's';
  public state: MonsterState = 'idle';

  public pathWaypoints: GridCoord[] = [];
  public targetWorldPos: ex.Vector | null = null;
  public attackCooldown: number = 0;
  public hurtTimer: number = 0;
  public fleeTimer: number = 0;
  public hasAggroed: boolean = false;

  constructor(type: MonsterType, gridPos: GridCoord) {
    const config = MONSTER_CONFIGS[type];
    const world = gridToWorldCenter(gridPos.col, gridPos.row);
    super({
      name: config.name,
      pos: ex.vec(world.x, world.y),
      width: type === 'butcher' ? 48 : 32,
      height: type === 'butcher' ? 60 : 44,
      anchor: ex.vec(0.5, 0.85),
    });

    this.monsterType = type;
    this.config = config;
    this.currentHp = config.maxHp;
    this.gridPos = { ...gridPos };
    this.z = getIsoZIndex(this.gridPos.col, this.gridPos.row, 0, 4);
  }

  setPath(waypoints: GridCoord[]): void {
    if (this.state === 'dead' || this.state === 'hurt') return;
    this.pathWaypoints = [...waypoints];
    if (this.pathWaypoints.length > 0) {
      if (this.state !== 'flee') {
        this.state = 'chase';
      }
      this.startNextWaypoint();
    }
  }

  stopMoving(): void {
    this.pathWaypoints = [];
    this.targetWorldPos = null;
    if (this.state === 'chase' || this.state === 'flee') {
      this.state = 'idle';
    }
  }

  private startNextWaypoint(): void {
    if (this.pathWaypoints.length === 0) {
      this.targetWorldPos = null;
      if (this.state === 'chase' || this.state === 'flee') {
        this.state = 'idle';
      }
      return;
    }

    const nextGrid = this.pathWaypoints.shift()!;
    this.facing = getDirection(this.gridPos, nextGrid);
    this.gridPos = { ...nextGrid };
    const worldCenter = gridToWorldCenter(nextGrid.col, nextGrid.row);
    this.targetWorldPos = ex.vec(worldCenter.x, worldCenter.y);
    this.z = getIsoZIndex(this.gridPos.col, this.gridPos.row, 0, 4);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    const dt = delta / 1000;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0 && this.state === 'attack') {
        this.state = 'idle';
      }
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0 && this.state === 'hurt') {
        this.state = 'idle';
      }
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer -= dt;
      if (this.fleeTimer <= 0 && this.state === 'flee') {
        this.state = 'idle';
      }
    }

    if ((this.state === 'chase' || this.state === 'flee') && this.targetWorldPos) {
      const dirVec = this.targetWorldPos.sub(this.pos);
      const dist = dirVec.size;
      const step = this.config.speed * dt;

      if (dist <= step) {
        this.pos = this.targetWorldPos.clone();
        this.startNextWaypoint();
      } else {
        this.pos = this.pos.add(dirVec.normalize().scale(step));
        const currentGrid = worldToGrid(this.pos.x, this.pos.y);
        this.z = getIsoZIndex(currentGrid.col, currentGrid.row, 0, 4);
      }
    }
  }

  startAttack(targetGrid: GridCoord): void {
    this.stopMoving();
    this.facing = getDirection(this.gridPos, targetGrid);
    this.state = 'attack';
    this.attackCooldown = this.config.attackSpeed;
  }

  takeDamage(amount: number): boolean {
    if (this.state === 'dead') return false;

    this.currentHp = Math.max(0, this.currentHp - amount);
    this.hasAggroed = true;

    if (this.currentHp <= 0) {
      this.state = 'dead';
      this.stopMoving();
      return true;
    }

    if (amount >= this.config.maxHp * 0.2) {
      this.state = 'hurt';
      this.hurtTimer = 0.25;
      this.stopMoving();
    }

    return false;
  }
}
