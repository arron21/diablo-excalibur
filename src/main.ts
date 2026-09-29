import * as ex from 'excalibur';
import { TownScene } from './scenes/town-scene';
import { DungeonScene } from './scenes/dungeon-scene';
import { Player } from './entities/player';
import { InventoryManager } from './items/inventory';
import { CharacterClass } from './entities/stats';
import { GothicHUD } from './ui/hud';
import { CharacterSheetUI } from './ui/character-sheet';
import { InventoryWindowUI } from './ui/inventory-window';
import { VendorWindowUI } from './ui/vendor-window';
import { FloatingTextManager } from './ui/floating-text';
import { BASE_ITEMS, generateLootItem } from './items/affixes';
import { eventBus } from './core/events';
import { soundSynth } from './audio/sound-synth';

class DiabloGame {
  private engine: ex.Engine;
  private townScene!: TownScene;
  private dungeonScene!: DungeonScene;
  private inventory!: InventoryManager;
  private player!: Player;

  private hud!: GothicHUD;
  private charSheetUI!: CharacterSheetUI;
  private inventoryUI!: InventoryWindowUI;
  private vendorUI!: VendorWindowUI;
  private floatingText!: FloatingTextManager;

  constructor() {
    this.engine = new ex.Engine({
      canvasElementId: 'game-canvas',
      displayMode: ex.DisplayMode.FillScreen,
      backgroundColor: ex.Color.fromHex('#0a0908'),
      antialiasing: false, // Crisp retro pixels
    });

    this.initGame('warrior');
  }

  private initGame(charClass: CharacterClass): void {
    this.inventory = new InventoryManager();
    this.player = new Player({ col: 15, row: 15 }, charClass);

    // Equip starting items based on class
    this.equipStarterGear(charClass);

    // Initialize scenes
    this.townScene = new TownScene();
    this.townScene.player = this.player;
    this.townScene.inventory = this.inventory;

    this.dungeonScene = new DungeonScene();
    this.dungeonScene.player = this.player;
    this.dungeonScene.inventory = this.inventory;

    this.engine.addScene('town', this.townScene);
    this.engine.addScene('dungeon', this.dungeonScene);

    // Initialize UI
    this.floatingText = new FloatingTextManager();
    this.hud = new GothicHUD(this.player, this.inventory);
    this.charSheetUI = new CharacterSheetUI(this.player);
    this.inventoryUI = new InventoryWindowUI(this.inventory, this.player);
    this.vendorUI = new VendorWindowUI(this.inventory, this.player);

    // Handle scene transitions
    eventBus.on('scene:change', (data) => {
      if (data.targetScene === 'dungeon') {
        this.engine.goToScene('dungeon');
      } else if (data.targetScene === 'town') {
        this.townScene.hasTownPortal = true;
        this.townScene.portalSpawnCoord = { col: 15, row: 16 };
        this.engine.goToScene('town');
      }
    });

    // Provide camera coordinate tracking for floating text
    this.engine.on('postupdate', () => {
      const cam = this.engine.currentScene.camera;
      (window as any).__cameraX = cam.pos.x;
      (window as any).__cameraY = cam.pos.y;
    });
  }

  private equipStarterGear(charClass: CharacterClass): void {
    if (charClass === 'warrior') {
      const sword = BASE_ITEMS.find((i) => i.name === 'Short Sword')!;
      const shield = BASE_ITEMS.find((i) => i.name === 'Buckler')!;
      const pot1 = BASE_ITEMS.find((i) => i.name === 'Potion of Healing')!;
      const pot2 = BASE_ITEMS.find((i) => i.name === 'Potion of Healing')!;

      this.inventory.equipItem({ ...sword, baseName: sword.name, id: 'start_sword', quality: 'normal' }, this.player);
      this.inventory.equipItem({ ...shield, baseName: shield.name, id: 'start_shield', quality: 'normal' }, this.player);
      this.inventory.addItem({ ...pot1, baseName: pot1.name, id: 'start_p1', quality: 'normal' });
      this.inventory.addItem({ ...pot2, baseName: pot2.name, id: 'start_p2', quality: 'normal' });
    } else if (charClass === 'rogue') {
      const bow = BASE_ITEMS.find((i) => i.name === 'Short Bow')!;
      const rags = BASE_ITEMS.find((i) => i.name === 'Leather Armor')!;
      const pot = BASE_ITEMS.find((i) => i.name === 'Potion of Healing')!;

      this.inventory.equipItem({ ...bow, baseName: bow.name, id: 'start_bow', quality: 'normal' }, this.player);
      this.inventory.equipItem({ ...rags, baseName: rags.name, id: 'start_rags', quality: 'normal' }, this.player);
      this.inventory.addItem({ ...pot, baseName: pot.name, id: 'start_p1', quality: 'normal' });
    } else {
      const cap = BASE_ITEMS.find((i) => i.name === 'Cap')!;
      const potM = BASE_ITEMS.find((i) => i.name === 'Potion of Mana')!;
      const potH = BASE_ITEMS.find((i) => i.name === 'Potion of Healing')!;

      this.inventory.equipItem({ ...cap, baseName: cap.name, id: 'start_cap', quality: 'normal' }, this.player);
      this.inventory.addItem({ ...potM, baseName: potM.name, id: 'start_pm1', quality: 'normal' });
      this.inventory.addItem({ ...potH, baseName: potH.name, id: 'start_ph1', quality: 'normal' });
    }
  }

  public start(): void {
    this.engine.start('town').then(() => {
      soundSynth.startMusic();
    });
  }

  public setClassAndStart(charClass: CharacterClass): void {
    this.initGame(charClass);
    this.start();
  }
}

// Boot game when DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('class-select-modal');
  const classCards = document.querySelectorAll('.class-card');

  let gameStarted = false;
  const launch = (cls: CharacterClass) => {
    if (gameStarted) return;
    gameStarted = true;
    if (modal) modal.style.display = 'none';
    const game = new DiabloGame();
    game.setClassAndStart(cls);
  };

  classCards.forEach((card) => {
    card.addEventListener('click', () => {
      const cls = (card.getAttribute('data-class') as CharacterClass) || 'warrior';
      launch(cls);
    });
  });
});
