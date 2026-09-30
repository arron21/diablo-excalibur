# Diablo: Tristram & The Cathedral (Excalibur.js ARPG)

A classic Action Role-Playing Game (ARPG) inspired by the original 1996 **Diablo**, built with **Excalibur.js**, TypeScript, and Vite.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Excalibur.js](https://img.shields.io/badge/engine-Excalibur.js%20v0.32-red.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript%205-blue.svg)
![Vite](https://img.shields.io/badge/bundler-Vite%206-purple.svg)
[![Deploy to GitHub Pages](https://github.com/arron21/diablo-excalibur/actions/workflows/deploy.yml/badge.svg)](https://github.com/arron21/diablo-excalibur/actions/workflows/deploy.yml)

🎮 **Play Live in Browser**: [https://arron21.github.io/diablo-excalibur/](https://arron21.github.io/diablo-excalibur/)

---

## Features

- **Isometric 2.5D Engine**: 2:1 dimetric projection, depth z-sorting, 8-directional facing, and Bresenham line-of-sight raycasting.
- **Dynamic Fog of War & Torchlight**: Real-time raycasting obscuring unrevealed rooms, with dim explored memory and warm, flickering torchlight around the player.
- **Classic Tri-Class Roster**:
  - **Warrior**: High Strength and Vitality, master of shields, heavy armor, and close-quarters combat.
  - **Rogue**: High Dexterity, precision to-hit ratings, and deadly bow combat.
  - **Sorcerer**: High Magic pool with offensive and utility spells (Firebolt, Charged Bolt, Fire Wall, Heal, Town Portal).
- **Procedural Cathedral Level 1**: Multi-room cathedral layout with openable wooden doors, smashable barrels, loot chests, and shrines.
- **Iconic Boss Encounter**: **The Butcher** in his blood-drenched chamber (*"Ah, fresh meat!"*), wielding high speed, heavy cleave damage, and dropping the unique **The Butcher's Cleaver**.
- **Monster Hierarchy & AI**: Skeleton Warriors, Skeleton Archers (with ranged kiting), Fallen Scavengers (with pack panic behavior), and Boss pursuit.
- **Tetris Grid Inventory (10x4)**: Spatial item placement supporting 1x1, 1x2, 1x3, 2x3 items, paperdoll equipment slots, 4-slot belt hotbar, and Diablo-style magic/unique affixes (*Godly*, *of the Whale*, *Fiery*, etc.).
- **Town Hub (Tristram)**: Peaceful town square with Deckard Cain (identifying & lore), Griswold the Blacksmith (weapons & armor shop), Pepin the Healer (healing & potions), and Adria the Witch (scrolls & rings).
- **Classic Gothic HUD**: Animated liquid red Health Orb and blue Mana Orb with hover readouts, Character Sheet with `[+]` attribute allocation on level up, and vendor windows.
- **Zero External Asset Dependencies**:
  - Built-in procedural canvas sprite generator for tiles, 8-directional character/monster animations, and icons.
  - Procedural Web Audio API sound synthesizer for all combat SFX (slashes, blocks, monster roars, gold clinks) and atmospheric Tristram 12-string acoustic guitar theme.
  - Pluggable loader hooks for loading custom PNG spritesheets and external audio files.

---

## Controls

| Action | Control |
|---|---|
| **Move / Attack / Interact** | `Left-Click` on floor, monster, NPC, door, chest, or ground loot |
| **Attack in Place** | `Shift + Left-Click` towards cursor |
| **Cast Spell** | `Right-Click` towards cursor |
| **Belt Potions** | `1`, `2`, `3`, `4` number keys |
| **Character Sheet** | `C` key or `[ATTRIB]` button |
| **Inventory & Paperdoll** | `I` key or `[INVENT]` button |
| **Spellbook Selector** | `S` key or `[SPELL]` button |
| **Highlight Ground Loot** | Hold `Alt` |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
git clone https://github.com/arron21/diablo-excalibur.git
cd diablo-excalibur
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Run Automated Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
```

---

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes and version history.

---

## License
MIT
