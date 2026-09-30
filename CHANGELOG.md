# Changelog

All notable changes to the **Diablo (Excalibur.js ARPG)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-30

### Added
- **Automated CI/CD Workflow**: Added GitHub Actions deployment pipeline (`.github/workflows/deploy.yml`) on Node.js 22 to run automated tests, compile TypeScript, and build production assets.
- **GitHub Pages Hosting**: Enabled live browser deployment at [https://arron21.github.io/diablo-excalibur/](https://arron21.github.io/diablo-excalibur/).
- **Live Demo Badge**: Added workflow status badge and live playable link to `README.md` and `walkthrough.md`.
- **Changelog**: Added `CHANGELOG.md` to track all ongoing changes.

### Changed
- **Relative Base Asset Path**: Updated `vite.config.ts` to use `base: './'` ensuring seamless asset resolution on GitHub Pages subpaths.

---

## [1.0.0] - 2026-09-29

### Added
- **Isometric Engine & Coordinate Math**:
  - Implemented 2:1 dimetric projection conversions (`gridToWorld` and `worldToGrid`) in `src/core/isometric.ts`.
  - Added depth z-sorting, 8-directional facing headings, and Bresenham line-of-sight raycasting.
- **A\* Pathfinding System**:
  - Implemented 8-directional A* grid pathfinder with diagonal corner-cutting prevention (`src/dungeon/pathfinding.ts`).
- **Procedural Cathedral Level 1**:
  - Generated connected rooms, corridors, openable wooden doors, smashable barrels, loot chests, and shrines (`src/dungeon/generator.ts`).
  - Added **The Butcher's Lair** (enclosed blood chamber with meat hooks).
- **Dynamic Fog of War & Lighting**:
  - Implemented real-time shadowcasting and circular torchlight with organic flame flicker (`src/dungeon/lighting.ts`).
- **Tri-Class Character System**:
  - Added **Warrior**, **Rogue**, and **Sorcerer** classes with authentic starting attributes, leveling curves, and stat allocation (`src/entities/stats.ts`).
  - Implemented Player actor with click-to-move, Shift+click attack in place, right-click spellcast, hit recovery stagger, and death/respawn (`src/entities/player.ts`).
- **Monster Hierarchy & AI**:
  - Implemented Skeleton Warrior, Skeleton Archer (kiting behavior), Fallen Scavenger (pack panic behavior), and **The Butcher** boss encounter (`src/entities/monster.ts`, `src/entities/monster-ai.ts`).
- **Combat & Spellcasting**:
  - Implemented classic combat formulas: To-Hit vs AC, weapon damage ranges, shield block deflections, critical strikes, and hit recovery (`src/combat/combat-system.ts`).
  - Added 5 spells: Firebolt, Charged Bolt, Fire Wall, Heal, and Town Portal (`src/spells/spells.ts`, `src/spells/spell-types.ts`).
- **Tetris Grid Inventory & Affix Loot System**:
  - Implemented 10x4 spatial inventory grid supporting multi-cell items (1x1, 1x2, 1x3, 2x3), equipment paperdoll slots, and 4-slot belt hotbar (`src/items/inventory.ts`).
  - Added procedural loot generator with Magic affixes (*Godly*, *of the Whale*, *Fiery*, etc.) and Unique items like **The Butcher's Cleaver** and **The Undead Crown** (`src/items/affixes.ts`).
- **Tristram Town Hub & NPCs**:
  - Implemented peaceful town square with central water fountain, graveyard cathedral descent, and Town Portal zone (`src/scenes/town-scene.ts`).
  - Added town NPCs: Deckard Cain (lore & free identify), Griswold the Blacksmith (gear shop), Pepin the Healer (healing & potions), and Adria the Witch (scrolls & rings) (`src/scenes/npcs.ts`).
- **Gothic HTML5/CSS Overlay & HUD**:
  - Built retro bottom bar with animated liquid Health & Mana orbs, belt hotbar, XP bar, and spell selector (`src/ui/hud.ts`, `style.css`).
  - Added popups for Character Sheet with `[+]` attribute buttons, 10x4 Tetris inventory, NPC vendor trading, and floating combat text.
- **Procedural Canvas Pixel Art**:
  - Created standalone canvas texture generator for isometric tiles, character/monster animations, and icons (`src/graphics/sprite-generator.ts`).
- **Procedural Web Audio Sound Synthesizer**:
  - Implemented Web Audio synthesis for combat sound effects and atmospheric 12-string Tristram acoustic guitar music (`src/audio/sound-synth.ts`).
- **Automated Test Suite**:
  - Added 19 unit tests with Vitest covering isometric math, A* pathfinding, inventory grid placement, combat formulas, and loot affixes.
- **Version Control**:
  - Initialized Git repository and published to GitHub: `https://github.com/arron21/diablo-excalibur`.
