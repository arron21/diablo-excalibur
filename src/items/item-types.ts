export type ItemCategory =
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'helm'
  | 'amulet'
  | 'ring'
  | 'potion_health'
  | 'potion_mana'
  | 'scroll'
  | 'gold';

export type EquipSlot =
  | 'head'
  | 'body'
  | 'main_hand'
  | 'off_hand'
  | 'amulet'
  | 'ring1'
  | 'ring2';

export type ItemQuality = 'normal' | 'magic' | 'unique';

export interface Item {
  id: string;
  name: string;
  baseName: string;
  category: ItemCategory;
  equipSlot?: EquipSlot;
  quality: ItemQuality;
  width: number;  // Grid cells wide (1 or 2)
  height: number; // Grid cells high (1, 2, or 3)
  icon: string;

  // Stats
  dmgMin?: number;
  dmgMax?: number;
  armorClass?: number;
  bonusStr?: number;
  bonusMag?: number;
  bonusDex?: number;
  bonusVit?: number;
  bonusHp?: number;
  bonusMana?: number;
  bonusToHit?: number;
  bonusDmgMin?: number;
  bonusDmgMax?: number;
  lifesteal?: number;

  // Requirements & Value
  reqStr?: number;
  reqDex?: number;
  reqMag?: number;
  value: number;
  quantity?: number; // For gold / stackables

  // Diablo flavor
  prefix?: string;
  suffix?: string;
  flavorText?: string;
}

export interface InventorySlotPosition {
  col: number;
  row: number;
}
