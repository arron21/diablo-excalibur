import { Player } from '../entities/player';
import { Monster } from '../entities/monster';
import { eventBus } from '../core/events';

export interface AttackResult {
  hit: boolean;
  blocked?: boolean;
  damage: number;
  critical?: boolean;
  killed: boolean;
}

export class CombatSystem {
  static resolvePlayerMelee(player: Player, monster: Monster): AttackResult {
    const toHit = player.stats.getToHit();
    const monsterAc = monster.config.ac;
    const hitChance = Math.min(95, Math.max(5, toHit - monsterAc));

    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll > hitChance) {
      return { hit: false, damage: 0, killed: false };
    }

    const dmgRange = player.stats.getDamage();
    let dmg = Math.floor(Math.random() * (dmgRange.max - dmgRange.min + 1)) + dmgRange.min;

    // Critical hit: 5% + dex/100
    const critChance = 5 + Math.floor(player.stats.totalDexterity / 10);
    const isCrit = Math.floor(Math.random() * 100) + 1 <= critChance;
    if (isCrit) {
      dmg = Math.floor(dmg * 1.75);
    }

    const killed = monster.takeDamage(dmg);

    if (killed) {
      const leveledUp = player.stats.addXp(monster.config.xp);
      eventBus.emit('monster:killed', {
        name: monster.config.name,
        xp: monster.config.xp,
        col: monster.gridPos.col,
        row: monster.gridPos.row,
      });

      if (leveledUp) {
        eventBus.emit('player:leveledUp', {
          level: player.stats.level,
          unspentPoints: player.stats.unspentStatPoints,
        });
      }
    }

    return { hit: true, damage: dmg, critical: isCrit, killed };
  }

  static resolveMonsterAttack(monster: Monster, player: Player): AttackResult {
    const toHit = monster.config.toHit;
    const playerAc = player.stats.getArmorClass();
    const hitChance = Math.min(95, Math.max(10, toHit - playerAc));

    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll > hitChance) {
      return { hit: false, damage: 0, killed: false };
    }

    // Shield block check
    const blockChance = player.stats.getBlockChance();
    if (blockChance > 0) {
      const blockRoll = Math.floor(Math.random() * 100) + 1;
      if (blockRoll <= blockChance) {
        return { hit: true, blocked: true, damage: 0, killed: false };
      }
    }

    const dmgMin = monster.config.dmgMin;
    const dmgMax = monster.config.dmgMax;
    const dmg = Math.floor(Math.random() * (dmgMax - dmgMin + 1)) + dmgMin;

    const killed = player.receiveDamage(dmg);

    return { hit: true, blocked: false, damage: dmg, killed };
  }
}
