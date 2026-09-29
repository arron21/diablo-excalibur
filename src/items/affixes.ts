import { Item, ItemQuality } from './item-types';

interface BaseItemTemplate {
  name: string;
  category: Item['category'];
  equipSlot?: Item['equipSlot'];
  width: number;
  height: number;
  icon: string;
  baseAc?: number;
  dmgMin?: number;
  dmgMax?: number;
  reqStr?: number;
  reqDex?: number;
  reqMag?: number;
  value: number;
}

export const BASE_ITEMS: BaseItemTemplate[] = [
  // Weapons
  { name: 'Short Sword', category: 'weapon', equipSlot: 'main_hand', width: 1, height: 3, icon: '🗡️', dmgMin: 2, dmgMax: 6, reqStr: 15, value: 50 },
  { name: 'Broad Sword', category: 'weapon', equipSlot: 'main_hand', width: 1, height: 3, icon: '⚔️', dmgMin: 4, dmgMax: 10, reqStr: 25, value: 120 },
  { name: 'Short Bow', category: 'weapon', equipSlot: 'main_hand', width: 1, height: 3, icon: '🏹', dmgMin: 2, dmgMax: 5, reqDex: 20, value: 60 },
  { name: 'Long Bow', category: 'weapon', equipSlot: 'main_hand', width: 1, height: 3, icon: '🏹', dmgMin: 4, dmgMax: 9, reqDex: 35, value: 150 },
  // Shields
  { name: 'Buckler', category: 'shield', equipSlot: 'off_hand', width: 2, height: 2, icon: '🛡️', baseAc: 4, reqStr: 15, value: 40 },
  { name: 'Gothic Shield', category: 'shield', equipSlot: 'off_hand', width: 2, height: 3, icon: '🛡️', baseAc: 12, reqStr: 30, value: 160 },
  // Armor
  { name: 'Rags', category: 'armor', equipSlot: 'body', width: 2, height: 3, icon: '🥋', baseAc: 2, value: 10 },
  { name: 'Leather Armor', category: 'armor', equipSlot: 'body', width: 2, height: 3, icon: '🦺', baseAc: 6, reqStr: 15, value: 75 },
  { name: 'Ring Mail', category: 'armor', equipSlot: 'body', width: 2, height: 3, icon: '🦺', baseAc: 14, reqStr: 25, value: 200 },
  { name: 'Plate Mail', category: 'armor', equipSlot: 'body', width: 2, height: 3, icon: '🦾', baseAc: 28, reqStr: 40, value: 550 },
  // Helms
  { name: 'Cap', category: 'helm', equipSlot: 'head', width: 2, height: 2, icon: '🧢', baseAc: 2, value: 25 },
  { name: 'Great Helm', category: 'helm', equipSlot: 'head', width: 2, height: 2, icon: '⛑️', baseAc: 9, reqStr: 25, value: 140 },
  // Jewelry
  { name: 'Ring', category: 'ring', equipSlot: 'ring1', width: 1, height: 1, icon: '💍', value: 80 },
  { name: 'Amulet', category: 'amulet', equipSlot: 'amulet', width: 1, height: 1, icon: '📿', value: 120 },
  // Consumables
  { name: 'Potion of Healing', category: 'potion_health', width: 1, height: 1, icon: '🧪', value: 30 },
  { name: 'Potion of Mana', category: 'potion_mana', width: 1, height: 1, icon: '🧪', value: 30 },
  { name: 'Scroll of Town Portal', category: 'scroll', width: 1, height: 1, icon: '📜', value: 50 },
];

export const UNIQUE_ITEMS: Record<string, Item> = {
  butchers_cleaver: {
    id: 'unique_butchers_cleaver',
    name: "The Butcher's Cleaver",
    baseName: 'Meat Cleaver',
    category: 'weapon',
    equipSlot: 'main_hand',
    quality: 'unique',
    width: 1,
    height: 3,
    icon: '🪓',
    dmgMin: 6,
    dmgMax: 18,
    bonusStr: 8,
    bonusHp: 20,
    bonusToHit: 15,
    value: 1200,
    flavorText: 'Still dripping with the blood of its previous victims.',
  },
  undead_crown: {
    id: 'unique_undead_crown',
    name: 'The Undead Crown',
    baseName: 'Crown',
    category: 'helm',
    equipSlot: 'head',
    quality: 'unique',
    width: 2,
    height: 2,
    icon: '👑',
    armorClass: 12,
    lifesteal: 6,
    bonusHp: 15,
    value: 900,
    flavorText: 'An ancient relic worn by long-forgotten bone kings.',
  },
};

interface Affix {
  name: string;
  apply: (item: Item) => void;
}

const PREFIXES: Affix[] = [
  { name: 'Bronze', apply: (item) => { item.bonusToHit = (item.bonusToHit || 0) + 10; item.value += 40; } },
  { name: 'Iron', apply: (item) => { item.bonusToHit = (item.bonusToHit || 0) + 20; item.value += 90; } },
  { name: 'Silver', apply: (item) => { item.bonusToHit = (item.bonusToHit || 0) + 30; item.value += 160; } },
  { name: 'Fiery', apply: (item) => { item.dmgMin = (item.dmgMin || 0) + 2; item.dmgMax = (item.dmgMax || 0) + 5; item.value += 120; } },
  { name: 'Sturdy', apply: (item) => { item.armorClass = (item.armorClass || 0) + 4; item.value += 60; } },
  { name: 'Godly', apply: (item) => { item.armorClass = (item.armorClass || 0) + 12; item.value += 300; } },
  { name: 'Ruby', apply: (item) => { item.bonusHp = (item.bonusHp || 0) + 20; item.value += 80; } },
  { name: 'Sapphire', apply: (item) => { item.bonusMana = (item.bonusMana || 0) + 20; item.value += 80; } },
];

const SUFFIXES: Affix[] = [
  { name: 'of Strength', apply: (item) => { item.bonusStr = (item.bonusStr || 0) + 4; item.value += 50; } },
  { name: 'of Dexterity', apply: (item) => { item.bonusDex = (item.bonusDex || 0) + 4; item.value += 50; } },
  { name: 'of Magic', apply: (item) => { item.bonusMag = (item.bonusMag || 0) + 4; item.value += 50; } },
  { name: 'of Vitality', apply: (item) => { item.bonusVit = (item.bonusVit || 0) + 4; item.value += 50; } },
  { name: 'of the Bear', apply: (item) => { item.dmgMax = (item.dmgMax || 0) + 4; item.bonusStr = (item.bonusStr || 0) + 3; item.value += 90; } },
  { name: 'of the Whale', apply: (item) => { item.bonusHp = (item.bonusHp || 0) + 40; item.value += 180; } },
  { name: 'of the Bat', apply: (item) => { item.lifesteal = (item.lifesteal || 0) + 4; item.value += 140; } },
];

let idGen = 1000;

export function generateLootItem(qualityPreference?: ItemQuality): Item {
  // 30% chance for consumables/potions
  const pickConsumable = Math.random() < 0.35 && !qualityPreference;
  let pool = BASE_ITEMS;
  if (pickConsumable) {
    pool = BASE_ITEMS.filter((i) => i.category.startsWith('potion') || i.category === 'scroll');
  }

  const template = pool[Math.floor(Math.random() * pool.length)];
  const item: Item = {
    id: `item_${idGen++}`,
    name: template.name,
    baseName: template.name,
    category: template.category,
    equipSlot: template.equipSlot,
    quality: 'normal',
    width: template.width,
    height: template.height,
    icon: template.icon,
    value: template.value,
    reqStr: template.reqStr,
    reqDex: template.reqDex,
    reqMag: template.reqMag,
    armorClass: template.baseAc,
    dmgMin: template.dmgMin,
    dmgMax: template.dmgMax,
  };

  // Potions and scrolls don't roll magic affixes
  if (item.category.startsWith('potion') || item.category === 'scroll') {
    return item;
  }

  let quality = qualityPreference;
  if (!quality) {
    const roll = Math.random();
    if (roll < 0.05) quality = 'unique';
    else if (roll < 0.35) quality = 'magic';
    else quality = 'normal';
  }

  if (quality === 'unique') {
    const uniqueKeys = Object.keys(UNIQUE_ITEMS);
    const chosen = UNIQUE_ITEMS[uniqueKeys[Math.floor(Math.random() * uniqueKeys.length)]];
    return { ...chosen, id: `item_${idGen++}` };
  }

  if (quality === 'magic') {
    item.quality = 'magic';
    const rollPrefix = Math.random() < 0.7;
    const rollSuffix = Math.random() < 0.7 || !rollPrefix;

    let pName = '';
    let sName = '';

    if (rollPrefix) {
      const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      p.apply(item);
      item.prefix = p.name;
      pName = `${p.name} `;
    }

    if (rollSuffix) {
      const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      s.apply(item);
      item.suffix = s.name;
      sName = ` ${s.name}`;
    }

    item.name = `${pName}${item.baseName}${sName}`;
  }

  return item;
}

export function generateGold(amountMin: number = 10, amountMax: number = 40): Item {
  const amt = Math.floor(Math.random() * (amountMax - amountMin + 1)) + amountMin;
  return {
    id: `gold_${idGen++}`,
    name: `${amt} Gold Pieces`,
    baseName: 'Gold',
    category: 'gold',
    quality: 'normal',
    width: 1,
    height: 1,
    icon: '🪙',
    value: amt,
    quantity: amt,
  };
}
