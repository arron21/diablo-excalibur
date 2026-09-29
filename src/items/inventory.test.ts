import { describe, it, expect } from 'vitest';
import { InventoryManager } from './inventory';
import { Item } from './item-types';
import { Player } from '../entities/player';

describe('Tetris Inventory Manager', () => {
  it('places a 1x1 item in empty grid', () => {
    const inv = new InventoryManager();
    const item: Item = {
      id: 'pot_1',
      name: 'Health Potion',
      baseName: 'Potion',
      category: 'potion_health',
      quality: 'normal',
      width: 1,
      height: 1,
      icon: '🧪',
      value: 20,
    };

    const placed = inv.placeItemAt(item, 0, 0);
    expect(placed).toBe(true);
    expect(inv.grid[0][0]).toBe(item);
  });

  it('rejects placing a multi-cell item if it overlaps another item', () => {
    const inv = new InventoryManager();
    const dagger: Item = {
      id: 'dag_1',
      name: 'Dagger',
      baseName: 'Dagger',
      category: 'weapon',
      quality: 'normal',
      width: 1,
      height: 2,
      icon: '🗡️',
      value: 30,
    };
    const sword: Item = {
      id: 'sw_1',
      name: 'Short Sword',
      baseName: 'Short Sword',
      category: 'weapon',
      quality: 'normal',
      width: 1,
      height: 3,
      icon: '⚔️',
      value: 50,
    };

    inv.placeItemAt(dagger, 0, 0); // Occupies (0,0) and (0,1)
    const canPlaceSword = inv.canPlaceAt(sword, 0, 1);
    expect(canPlaceSword).toBe(false);
  });

  it('equips armor and recalculates player armor class', () => {
    const inv = new InventoryManager();
    const player = new Player({ col: 0, row: 0 }, 'warrior');
    const baseAc = player.stats.getArmorClass();

    const armor: Item = {
      id: 'plate_1',
      name: 'Plate Mail',
      baseName: 'Plate Mail',
      category: 'armor',
      equipSlot: 'body',
      quality: 'normal',
      width: 2,
      height: 3,
      icon: '🦾',
      armorClass: 25,
      reqStr: 20,
      value: 300,
    };

    const success = inv.equipItem(armor, player);
    expect(success).toBe(true);
    expect(inv.equipped.get('body')).toBe(armor);
    expect(player.stats.getArmorClass()).toBe(baseAc + 25);
  });

  it('uses health potion from belt and heals player', () => {
    const inv = new InventoryManager();
    const player = new Player({ col: 0, row: 0 }, 'warrior');
    player.stats.currentHp = 10; // Damaged

    const potion: Item = {
      id: 'pot_1',
      name: 'Potion of Healing',
      baseName: 'Potion',
      category: 'potion_health',
      quality: 'normal',
      width: 1,
      height: 1,
      icon: '🧪',
      value: 30,
    };

    inv.belt[0] = potion;
    const used = inv.useBeltSlot(0, player);
    expect(used).toBe(true);
    expect(inv.belt[0]).toBeNull();
    expect(player.stats.currentHp).toBe(52); // Capped at warrior's maxHp (52)
  });
});
