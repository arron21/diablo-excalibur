import { describe, it, expect } from 'vitest';
import { generateLootItem, UNIQUE_ITEMS } from './affixes';

describe('Diablo Affix and Loot Generator', () => {
  it('generates Magic items with prefixes or suffixes', () => {
    const magicItem = generateLootItem('magic');
    expect(magicItem.quality).toBe('magic');
    const hasAffix = Boolean(magicItem.prefix || magicItem.suffix);
    expect(hasAffix).toBe(true);
    expect(magicItem.name).not.toBe(magicItem.baseName);
  });

  it('contains authentic unique items like The Butcher\'s Cleaver', () => {
    const cleaver = UNIQUE_ITEMS.butchers_cleaver;
    expect(cleaver).toBeDefined();
    expect(cleaver.quality).toBe('unique');
    expect(cleaver.name).toBe("The Butcher's Cleaver");
    expect(cleaver.bonusStr).toBe(8);
  });
});
