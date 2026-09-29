import { TOWN_NPCS, NPCData } from '../scenes/npcs';
import { InventoryManager } from '../items/inventory';
import { Player } from '../entities/player';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';

export class VendorWindowUI {
  private element: HTMLElement;
  private inventory: InventoryManager;
  private player: Player;
  public isVisible: boolean = false;
  private currentNpc: NPCData | null = null;

  constructor(inventory: InventoryManager, player: Player) {
    this.inventory = inventory;
    this.player = player;

    this.element = document.createElement('div');
    this.element.id = 'vendor-window';
    this.element.className = 'gothic-window hidden';
    document.body.appendChild(this.element);

    eventBus.on('vendor:open', (data) => {
      const npc = TOWN_NPCS.find((n) => n.id === data.npcId);
      if (npc) {
        this.open(npc);
      }
    });

    eventBus.on('vendor:close', () => {
      this.close();
    });
  }

  setContext(inventory: InventoryManager, player: Player): void {
    this.inventory = inventory;
    this.player = player;
  }

  open(npc: NPCData): void {
    this.currentNpc = npc;
    this.isVisible = true;
    this.element.classList.remove('hidden');
    soundSynth.playHit();
    this.render();
  }

  close(): void {
    this.isVisible = false;
    this.element.classList.add('hidden');
    this.currentNpc = null;
  }

  render(): void {
    if (!this.currentNpc) return;
    const npc = this.currentNpc;

    let waresHtml = '';
    if (npc.shopItems && npc.shopItems.length > 0) {
      waresHtml += `<div class="section-title">WARES FOR SALE</div><div class="vendor-items-list">`;
      for (const item of npc.shopItems) {
        const canAfford = this.inventory.gold >= item.value;
        waresHtml += `
          <div class="vendor-item-card">
            <span class="v-icon">${item.icon}</span>
            <div class="v-info">
              <span class="v-name quality-${item.quality}">${item.name}</span>
              <span class="v-cost">🪙 ${item.value} Gold</span>
            </div>
            <button class="buy-btn" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>BUY</button>
          </div>
        `;
      }
      waresHtml += `</div>`;
    }

    let specialActionHtml = '';
    if (npc.id === 'pepin') {
      specialActionHtml = `<button class="service-btn" id="healer-service">HEAL ALL WOUNDS (FREE)</button>`;
    } else if (npc.id === 'cain') {
      specialActionHtml = `<button class="service-btn" id="cain-service">IDENTIFY ALL ITEMS (FREE)</button>`;
    }

    this.element.innerHTML = `
      <div class="window-header">
        <span class="window-title">${npc.name.toUpperCase()} - ${npc.title.toUpperCase()}</span>
        <button class="close-btn" id="close-vendor-btn">✕</button>
      </div>

      <div class="vendor-dialogue">
        <p>"${npc.dialogue}"</p>
      </div>

      ${specialActionHtml}
      ${waresHtml}

      <div class="inv-footer">
        <span class="gold-display">YOUR GOLD: 🪙 ${this.inventory.gold}</span>
      </div>
    `;

    // Bind close
    this.element.querySelector('#close-vendor-btn')?.addEventListener('click', () => {
      this.close();
    });

    // Bind Pepin heal
    this.element.querySelector('#healer-service')?.addEventListener('click', () => {
      soundSynth.playLevelUp();
      this.player.stats.heal(999);
      this.player.stats.restoreMana(999);
      eventBus.emit('player:statsChanged', undefined);
      eventBus.emit('combat:floatingText', {
        text: 'Wounds Fully Tended!',
        x: this.player.pos.x,
        y: this.player.pos.y - 45,
        color: '#4ade80',
      });
    });

    // Bind Cain identify
    this.element.querySelector('#cain-service')?.addEventListener('click', () => {
      soundSynth.playLevelUp();
      eventBus.emit('combat:floatingText', {
        text: 'All Items Identified!',
        x: this.player.pos.x,
        y: this.player.pos.y - 45,
        color: '#facc15',
      });
    });

    // Bind Buy buttons
    this.element.querySelectorAll('.buy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemId = (e.target as HTMLElement).getAttribute('data-item-id');
        const itemToBuy = npc.shopItems?.find((i) => i.id === itemId);
        if (itemToBuy && this.inventory.gold >= itemToBuy.value) {
          const added = this.inventory.addItem({ ...itemToBuy, id: `bought_${Date.now()}` });
          if (added) {
            this.inventory.gold -= itemToBuy.value;
            soundSynth.playGold();
            this.render();
            eventBus.emit('inventory:changed', undefined);
          } else {
            eventBus.emit('combat:floatingText', {
              text: 'Inventory Full!',
              x: this.player.pos.x,
              y: this.player.pos.y - 40,
              color: '#ef4444',
            });
          }
        }
      });
    });
  }
}
