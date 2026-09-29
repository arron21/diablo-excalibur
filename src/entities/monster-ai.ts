import { Monster } from './monster';
import { Player } from './player';
import { GridCoord, getGridDistance, hasLineOfSight } from '../core/isometric';
import { AStarPathfinder } from '../dungeon/pathfinding';
import { eventBus } from '../core/events';

export class MonsterAISystem {
  private pathfinder: AStarPathfinder;
  private pathRecalcCooldowns: Map<Monster, number> = new Map();

  constructor(pathfinder: AStarPathfinder) {
    this.pathfinder = pathfinder;
  }

  update(
    monsters: Monster[],
    player: Player,
    isWalkable: (col: number, row: number) => boolean,
    isOpaque: (col: number, row: number) => boolean,
    deltaMs: number,
    onMonsterAttack: (monster: Monster, target: Player) => void
  ): void {
    if (player.playerState === 'dead') return;

    const dt = deltaMs / 1000;

    for (const monster of monsters) {
      if (monster.state === 'dead') continue;

      let cd = this.pathRecalcCooldowns.get(monster) || 0;
      cd = Math.max(0, cd - dt);
      this.pathRecalcCooldowns.set(monster, cd);

      const dist = getGridDistance(monster.gridPos, player.gridPos);
      const aggroRange = monster.monsterType === 'butcher' ? 10 : 7;
      const canSeePlayer = dist <= aggroRange && hasLineOfSight(monster.gridPos, player.gridPos, isOpaque);

      if (canSeePlayer && !monster.hasAggroed) {
        monster.hasAggroed = true;
        if (monster.monsterType === 'butcher') {
          eventBus.emit('boss:aggro', {
            name: 'The Butcher',
            roar: 'Ah, fresh meat!',
          });
        }
      }

      if (!monster.hasAggroed) {
        continue;
      }

      // 1. Archer specific behavior: keep distance and shoot
      if (monster.monsterType === 'archer') {
        if (dist <= 2.0) {
          // Too close, retreat
          if (cd <= 0) {
            const awayCol = monster.gridPos.col + Math.sign(monster.gridPos.col - player.gridPos.col) * 2;
            const awayRow = monster.gridPos.row + Math.sign(monster.gridPos.row - player.gridPos.row) * 2;
            const path = this.pathfinder.findPath(monster.gridPos, { col: awayCol, row: awayRow }, isWalkable);
            if (path.length > 0) {
              monster.setPath(path);
              this.pathRecalcCooldowns.set(monster, 0.6);
            }
          }
        } else if (dist <= monster.config.attackRange && canSeePlayer) {
          // In range, attack
          monster.stopMoving();
          if (monster.attackCooldown <= 0) {
            monster.startAttack(player.gridPos);
            onMonsterAttack(monster, player);
          }
        } else {
          // Approach player into bow range
          if (cd <= 0) {
            const path = this.pathfinder.findPath(monster.gridPos, player.gridPos, isWalkable);
            if (path.length > 0) {
              monster.setPath(path);
              this.pathRecalcCooldowns.set(monster, 0.5);
            }
          }
        }
        continue;
      }

      // 2. Scavenger fleeing behavior
      if (monster.state === 'flee') {
        if (cd <= 0) {
          const runCol = monster.gridPos.col + Math.sign(monster.gridPos.col - player.gridPos.col) * 3;
          const runRow = monster.gridPos.row + Math.sign(monster.gridPos.row - player.gridPos.row) * 3;
          const path = this.pathfinder.findPath(monster.gridPos, { col: runCol, row: runRow }, isWalkable);
          if (path.length > 0) {
            monster.setPath(path);
          }
          this.pathRecalcCooldowns.set(monster, 0.8);
        }
        continue;
      }

      // 3. Melee attack check (Skeleton, Scavenger, Butcher)
      if (dist <= monster.config.attackRange) {
        monster.stopMoving();
        if (monster.attackCooldown <= 0 && monster.state !== 'hurt') {
          monster.startAttack(player.gridPos);
          onMonsterAttack(monster, player);
        }
      } else {
        // Chase player
        if (cd <= 0 && monster.state !== 'attack' && monster.state !== 'hurt') {
          const path = this.pathfinder.findPath(monster.gridPos, player.gridPos, isWalkable);
          if (path.length > 0) {
            monster.setPath(path);
          }
          this.pathRecalcCooldowns.set(monster, 0.4);
        }
      }
    }
  }

  notifyMonsterKilled(killed: Monster, allMonsters: Monster[]): void {
    if (killed.monsterType === 'scavenger') {
      // Cause nearby scavengers to panic
      for (const m of allMonsters) {
        if (m !== killed && m.monsterType === 'scavenger' && m.state !== 'dead') {
          const dist = getGridDistance(killed.gridPos, m.gridPos);
          if (dist <= 6) {
            m.state = 'flee';
            m.fleeTimer = 2.5; // 2.5 seconds panic
          }
        }
      }
    }
  }
}
