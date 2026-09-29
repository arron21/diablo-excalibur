import { GridCoord } from '../core/isometric';
import { Item } from '../items/item-types';
import { BASE_ITEMS, generateLootItem } from '../items/affixes';

export interface NPCData {
  id: string;
  name: string;
  title: string;
  dialogue: string;
  gridPos: GridCoord;
  shopItems?: Item[];
}

export const TOWN_NPCS: NPCData[] = [
  {
    id: 'cain',
    name: 'Deckard Cain',
    title: 'Elder of Tristram',
    dialogue: 'Stay awhile and listen! The cathedral is tainted with dark evil. Deep within its chambers lies an abomination known as The Butcher. Slay him and recover his cleaver!',
    gridPos: { col: 14, row: 14 },
  },
  {
    id: 'griswold',
    name: 'Griswold',
    title: 'The Blacksmith',
    dialogue: 'Greetings! What can I do for ya? I forge the finest blades and hammer the sturdiest iron in Khanduras. Take a look at my wares!',
    gridPos: { col: 8, row: 12 },
    shopItems: [
      { id: 'shop_1', name: 'Broad Sword', baseName: 'Broad Sword', category: 'weapon', equipSlot: 'main_hand', quality: 'normal', width: 1, height: 3, icon: '⚔️', dmgMin: 4, dmgMax: 10, reqStr: 25, value: 120 },
      { id: 'shop_2', name: 'Gothic Shield', baseName: 'Gothic Shield', category: 'shield', equipSlot: 'off_hand', quality: 'normal', width: 2, height: 3, icon: '🛡️', armorClass: 12, reqStr: 30, value: 160 },
      { id: 'shop_3', name: 'Ring Mail', baseName: 'Ring Mail', category: 'armor', equipSlot: 'body', quality: 'normal', width: 2, height: 3, icon: '🦺', armorClass: 14, reqStr: 25, value: 200 },
      { id: 'shop_4', name: 'Great Helm', baseName: 'Great Helm', category: 'helm', equipSlot: 'head', quality: 'normal', width: 2, height: 2, icon: '⛑️', armorClass: 9, reqStr: 25, value: 140 },
    ],
  },
  {
    id: 'pepin',
    name: 'Pepin',
    title: 'The Healer',
    dialogue: 'The peace of the sanctuary be with you. Let me tend to your grievous wounds, brave hero. Take these draughts of life with you into the dark.',
    gridPos: { col: 18, row: 10 },
    shopItems: [
      { id: 'shop_p1', name: 'Potion of Healing', baseName: 'Healing Potion', category: 'potion_health', quality: 'normal', width: 1, height: 1, icon: '🧪', value: 30 },
      { id: 'shop_p2', name: 'Potion of Mana', baseName: 'Mana Potion', category: 'potion_mana', quality: 'normal', width: 1, height: 1, icon: '🧪', value: 30 },
    ],
  },
  {
    id: 'adria',
    name: 'Adria',
    title: 'The Witch',
    dialogue: 'I sense a soul in search of answers... The arcane forces pulse beneath the earth. Spells of flame and portals through the void are yours, for a price.',
    gridPos: { col: 22, row: 20 },
    shopItems: [
      { id: 'shop_a1', name: 'Scroll of Town Portal', baseName: 'Town Portal', category: 'scroll', quality: 'normal', width: 1, height: 1, icon: '📜', value: 50 },
      { id: 'shop_a2', name: 'Ring of Magic', baseName: 'Ring', category: 'ring', equipSlot: 'ring1', quality: 'magic', width: 1, height: 1, icon: '💍', bonusMag: 6, value: 180 },
    ],
  },
];
