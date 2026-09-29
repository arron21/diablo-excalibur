export interface SpellDefinition {
  id: string;
  name: string;
  manaCost: number;
  minMagicReq: number;
  description: string;
  icon: string;
  type: 'projectile' | 'self' | 'aoe' | 'utility';
}

export const SPELLS: Record<string, SpellDefinition> = {
  firebolt: {
    id: 'firebolt',
    name: 'Firebolt',
    manaCost: 6,
    minMagicReq: 10,
    description: 'Launches a flaming sphere that explodes on contact with foes.',
    icon: '🔥',
    type: 'projectile',
  },
  charged_bolt: {
    id: 'charged_bolt',
    name: 'Charged Bolt',
    manaCost: 9,
    minMagicReq: 15,
    description: 'Releases chaotic sparks of lightning crawling across the floor.',
    icon: '⚡',
    type: 'aoe',
  },
  firewall: {
    id: 'firewall',
    name: 'Fire Wall',
    manaCost: 16,
    minMagicReq: 25,
    description: 'Ignites a wall of roaring fire that burns all who step through.',
    icon: '🧱',
    type: 'aoe',
  },
  heal: {
    id: 'heal',
    name: 'Healing',
    manaCost: 12,
    minMagicReq: 10,
    description: 'Channels divine grace to restore health to the caster.',
    icon: '✨',
    type: 'self',
  },
  town_portal: {
    id: 'town_portal',
    name: 'Town Portal',
    manaCost: 20,
    minMagicReq: 15,
    description: 'Opens a swirling gateway to the safety of Tristram.',
    icon: '🌀',
    type: 'utility',
  },
};
