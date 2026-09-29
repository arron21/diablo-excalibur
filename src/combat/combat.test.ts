import { describe, it, expect } from 'vitest';
import { CharacterStats } from '../entities/stats';
import { Monster } from '../entities/monster';
import { Player } from '../entities/player';
import { CombatSystem } from './combat-system';

describe('Combat and Stats System', () => {
  it('correctly calculates initial Warrior attributes and derived stats', () => {
    const stats = new CharacterStats('warrior');
    expect(stats.strength).toBe(30);
    expect(stats.magic).toBe(10);
    expect(stats.dexterity).toBe(20);
    expect(stats.vitality).toBe(25);
    // Warrior HP: vit * 2 + level * 2 = 25 * 2 + 2 = 52
    expect(stats.getMaxHp()).toBe(52);
    // Warrior Mana: mag * 1 + level * 1 = 10 * 1 + 1 = 11
    expect(stats.getMaxMana()).toBe(11);
  });

  it('allocates stat points on level up', () => {
    const stats = new CharacterStats('warrior');
    expect(stats.unspentStatPoints).toBe(0);

    const leveled = stats.addXp(250); // Level 2 threshold is 200
    expect(leveled).toBe(true);
    expect(stats.level).toBe(2);
    expect(stats.unspentStatPoints).toBe(5);

    const allocated = stats.allocateStat('strength');
    expect(allocated).toBe(true);
    expect(stats.strength).toBe(31);
    expect(stats.unspentStatPoints).toBe(4);
  });

  it('resolves attack against monster reducing currentHp', () => {
    const player = new Player({ col: 0, row: 0 }, 'warrior');
    player.stats.bonusToHit = 1000; // Guarantee hit
    player.stats.baseWeaponDmgMin = 10;
    player.stats.baseWeaponDmgMax = 10;

    const monster = new Monster('skeleton', { col: 1, row: 0 });
    const initialHp = monster.currentHp;

    const res = CombatSystem.resolvePlayerMelee(player, monster);
    expect(res.hit).toBe(true);
    expect(res.damage).toBeGreaterThan(0);
    expect(monster.currentHp).toBeLessThan(initialHp);
  });
});
