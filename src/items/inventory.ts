import { Item, EquipSlot, InventorySlotPosition } from './item-types';
import { INVENTORY_COLS, INVENTORY_ROWS, BELT_SLOTS } from '../core/constants';
import { Player } from '../entities/player';
import { eventBus } from '../core/events';

export interface PlacedItem {
  item: Item;
  col: number;
  row: number;
}

export class InventoryManager {
  public grid: (Item | null)[][];
  public placedItems: PlacedItem[] = [];
  public equipped: Map<EquipSlot, Item> = new Map();
  public belt: (Item | null)[] = Array(BELT_SLOTS).fill(null);
  public gold: number = 100;

  constructor() {
    this.grid = Array.from({ length: INVENTORY_ROWS }, () =>
      Array(INVENTORY_COLS).fill(null)
    );
  }

  canPlaceAt(item: Item, col: number, row: number, ignoreItem?: Item): boolean {
    if (col < 0 || col + item.width > INVENTORY_COLS) return false;
    if (row < 0 || row + item.height > INVENTORY_ROWS) return false;

    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        const existing = this.grid[r][c];
        if (existing && existing !== ignoreItem) {
          return false;
        }
      }
    }
    return true;
  }

  findFreeSlot(item: Item): InventorySlotPosition | null {
    for (let r = 0; r <= INVENTORY_ROWS - item.height; r++) {
      for (let c = 0; c <= INVENTORY_COLS - item.width; c++) {
        if (this.canPlaceAt(item, c, r)) {
          return { col: c, row: r };
        }
      }
    }
    return null;
  }

  addItem(item: Item): boolean {
    if (item.category === 'gold') {
      this.gold += item.quantity || item.value;
      eventBus.emit('inventory:changed', undefined);
      return true;
    }

    // Try placing into belt if consumable and belt has open slot
    if (item.category.startsWith('potion') || item.category === 'scroll') {
      const openBeltIdx = this.belt.findIndex((s) => s === null);
      if (openBeltIdx !== -1) {
        this.belt[openBeltIdx] = item;
        eventBus.emit('inventory:changed', undefined);
        return true;
      }
    }

    const slot = this.findFreeSlot(item);
    if (!slot) return false;

    return this.placeItemAt(item, slot.col, slot.row);
  }

  placeItemAt(item: Item, col: number, row: number): boolean {
    if (!this.canPlaceAt(item, col, row)) return false;

    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        this.grid[r][c] = item;
      }
    }

    this.placedItems.push({ item, col, row });
    eventBus.emit('inventory:changed', undefined);
    return true;
  }

  removeItem(item: Item): boolean {
    const idx = this.placedItems.findIndex((p) => p.item.id === item.id);
    if (idx === -1) return false;

    const placed = this.placedItems[idx];
    for (let r = placed.row; r < placed.row + item.height; r++) {
      for (let c = placed.col; c < placed.col + item.width; c++) {
        if (this.grid[r][c] === item) {
          this.grid[r][c] = null;
        }
      }
    }

    this.placedItems.splice(idx, 1);
    eventBus.emit('inventory:changed', undefined);
    return true;
  }

  equipItem(item: Item, player: Player, targetSlot?: EquipSlot): boolean {
    const slot = targetSlot || item.equipSlot;
    if (!slot) return false;

    // Stat requirements check
    if (item.reqStr && player.stats.totalStrength < item.reqStr) return false;
    if (item.reqDex && player.stats.totalDexterity < item.reqDex) return false;
    if (item.reqMag && player.stats.totalMagic < item.reqMag) return false;

    // Remove from inventory grid if placed there
    this.removeItem(item);

    // Unequip currently equipped item in that slot if present
    const existing = this.equipped.get(slot);
    if (existing) {
      this.unequipItem(slot, player);
    }

    this.equipped.set(slot, item);
    this.recalculatePlayerStats(player);
    eventBus.emit('inventory:changed', undefined);
    eventBus.emit('player:statsChanged', undefined);
    return true;
  }

  unequipItem(slot: EquipSlot, player: Player): boolean {
    const item = this.equipped.get(slot);
    if (!item) return false;

    const freeSlot = this.findFreeSlot(item);
    if (!freeSlot) {
      // Inventory full!
      return false;
    }

    this.equipped.delete(slot);
    this.placeItemAt(item, freeSlot.col, freeSlot.row);
    this.recalculatePlayerStats(player);
    eventBus.emit('inventory:changed', undefined);
    eventBus.emit('player:statsChanged', undefined);
    return true;
  }

  useBeltSlot(slotIdx: number, player: Player): boolean {
    if (slotIdx < 0 || slotIdx >= BELT_SLOTS) return false;
    const item = this.belt[slotIdx];
    if (!item) return false;

    if (item.category === 'potion_health') {
      const restored = player.stats.heal(50);
      eventBus.emit('combat:floatingText', {
        text: `+${restored} HP`,
        x: player.pos.x,
        y: player.pos.y - 45,
        color: '#ef4444',
      });
      eventBus.emit('player:healed', {
        currentHp: player.stats.currentHp,
        maxHp: player.stats.getMaxHp(),
        amount: restored,
      });
      this.belt[slotIdx] = null;
      eventBus.emit('inventory:changed', undefined);
      return true;
    }

    if (item.category === 'potion_mana') {
      const restored = player.stats.restoreMana(40);
      eventBus.emit('combat:floatingText', {
        text: `+${restored} Mana`,
        x: player.pos.x,
        y: player.pos.y - 45,
        color: '#3b82f6',
      });
      eventBus.emit('player:manaChanged', {
        currentMana: player.stats.currentMana,
        maxMana: player.stats.getMaxMana(),
      });
      this.belt[slotIdx] = null;
      eventBus.emit('inventory:changed', undefined);
      return true;
    }

    return false;
  }

  recalculatePlayerStats(player: Player): void {
    let bonusAc = 0;
    let bonusToHit = 0;
    let bonusDmgMin = 0;
    let bonusDmgMax = 0;
    let bonusStr = 0;
    let bonusMag = 0;
    let bonusDex = 0;
    let bonusVit = 0;
    let bonusHp = 0;
    let bonusMana = 0;
    let hasShield = false;
    let baseWeaponMin = 2;
    let baseWeaponMax = 5;

    for (const [slot, item] of this.equipped.entries()) {
      if (item.armorClass) bonusAc += item.armorClass;
      if (item.bonusToHit) bonusToHit += item.bonusToHit;
      if (item.bonusDmgMin) bonusDmgMin += item.bonusDmgMin;
      if (item.bonusDmgMax) bonusDmgMax += item.bonusDmgMax;
      if (item.bonusStr) bonusStr += item.bonusStr;
      if (item.bonusMag) bonusMag += item.bonusMag;
      if (item.bonusDex) bonusDex += item.bonusDex;
      if (item.bonusVit) bonusVit += item.bonusVit;
      if (item.bonusHp) bonusHp += item.bonusHp;
      if (item.bonusMana) bonusMana += item.bonusMana;

      if (slot === 'off_hand' && item.category === 'shield') {
        hasShield = true;
      }
      if (slot === 'main_hand' && item.dmgMin && item.dmgMax) {
        baseWeaponMin = item.dmgMin;
        baseWeaponMax = item.dmgMax;
      }
    }

    player.stats.bonusAc = bonusAc;
    player.stats.bonusToHit = bonusToHit;
    player.stats.bonusDmgMin = bonusDmgMin;
    player.stats.bonusDmgMax = bonusDmgMax;
    player.stats.bonusStr = bonusStr;
    player.stats.bonusMag = bonusMag;
    player.stats.bonusDex = bonusDex;
    player.stats.bonusVit = bonusVit;
    player.stats.bonusMaxHp = bonusHp;
    player.stats.bonusMaxMana = bonusMana;
    player.stats.hasShield = hasShield;
    player.stats.baseWeaponDmgMin = baseWeaponMin;
    player.stats.baseWeaponDmgMax = baseWeaponMax;
  }
}
