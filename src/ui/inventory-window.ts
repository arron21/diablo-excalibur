import { InventoryManager } from '../items/inventory';
import { Player } from '../entities/player';
import { Item, EquipSlot } from '../items/item-types';
import { INVENTORY_COLS, INVENTORY_ROWS } from '../core/constants';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';

export class InventoryWindowUI {
  private element: HTMLElement;
  private tooltipEl: HTMLElement;
  private inventory: InventoryManager;
  private player: Player;
  public isVisible: boolean = false;

  constructor(inventory: InventoryManager, player: Player) {
    this.inventory = inventory;
    this.player = player;

    this.element = document.createElement('div');
    this.element.id = 'inventory-window';
    this.element.className = 'gothic-window hidden';
    document.body.appendChild(this.element);

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'item-tooltip';
    this.tooltipEl.className = 'item-tooltip hidden';
    document.body.appendChild(this.tooltipEl);

    eventBus.on('ui:toggleWindow', (data) => {
      if (data.windowName === 'inventory') {
        this.toggle();
      }
    });

    eventBus.on('inventory:changed', () => {
      if (this.isVisible) this.render();
    });

    this.render();
  }

  setContext(inventory: InventoryManager, player: Player): void {
    this.inventory = inventory;
    this.player = player;
    this.render();
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.element.classList.remove('hidden');
      this.render();
      soundSynth.playHit();
    } else {
      this.element.classList.add('hidden');
      this.hideTooltip();
    }
  }

  render(): void {
    this.element.innerHTML = `
      <div class="window-header">
        <span class="window-title">INVENTORY</span>
        <button class="close-btn" id="close-inv-btn">✕</button>
      </div>

      <div class="paperdoll-section">
        <div class="paperdoll-slot" data-slot="head" title="Head">${this.renderEquippedSlot('head')}</div>
        <div class="paperdoll-row">
          <div class="paperdoll-slot" data-slot="main_hand" title="Main Hand">${this.renderEquippedSlot('main_hand')}</div>
          <div class="paperdoll-slot slot-body" data-slot="body" title="Body Armor">${this.renderEquippedSlot('body')}</div>
          <div class="paperdoll-slot" data-slot="off_hand" title="Off Hand / Shield">${this.renderEquippedSlot('off_hand')}</div>
        </div>
        <div class="paperdoll-row jewelry-row">
          <div class="paperdoll-slot slot-small" data-slot="ring1" title="Left Ring">${this.renderEquippedSlot('ring1')}</div>
          <div class="paperdoll-slot slot-small" data-slot="amulet" title="Amulet">${this.renderEquippedSlot('amulet')}</div>
          <div class="paperdoll-slot slot-small" data-slot="ring2" title="Right Ring">${this.renderEquippedSlot('ring2')}</div>
        </div>
      </div>

      <div class="backpack-section">
        <div class="section-title">BACKPACK (10x4)</div>
        <div class="grid-container" id="inv-grid-container">
          ${this.renderBackpackGrid()}
        </div>
      </div>

      <div class="inv-footer">
        <span class="gold-display">🪙 ${this.inventory.gold} GOLD</span>
      </div>
    `;

    // Bind close
    this.element.querySelector('#close-inv-btn')?.addEventListener('click', () => {
      this.toggle();
    });

    // Bind equipped slot clicks (unequip)
    this.element.querySelectorAll('.paperdoll-slot').forEach((slotEl) => {
      const slot = slotEl.getAttribute('data-slot') as EquipSlot;
      slotEl.addEventListener('click', () => {
        if (this.inventory.equipped.has(slot)) {
          soundSynth.playHit();
          this.inventory.unequipItem(slot, this.player);
          this.hideTooltip();
        }
      });

      slotEl.addEventListener('mouseenter', (e) => {
        const item = this.inventory.equipped.get(slot);
        if (item) this.showTooltip(item, e as MouseEvent);
      });
      slotEl.addEventListener('mouseleave', () => this.hideTooltip());
    });

    // Bind backpack item clicks (equip / use)
    this.element.querySelectorAll('.placed-item-widget').forEach((itemEl) => {
      const itemId = itemEl.getAttribute('data-item-id');
      const placed = this.inventory.placedItems.find((p) => p.item.id === itemId);

      itemEl.addEventListener('click', () => {
        if (placed) {
          soundSynth.playHit();
          if (placed.item.equipSlot) {
            this.inventory.equipItem(placed.item, this.player);
          } else if (placed.item.category.startsWith('potion')) {
            if (placed.item.category === 'potion_health') {
              this.player.stats.heal(50);
            } else {
              this.player.stats.restoreMana(40);
            }
            this.inventory.removeItem(placed.item);
          }
          this.hideTooltip();
        }
      });

      itemEl.addEventListener('mouseenter', (e) => {
        if (placed) this.showTooltip(placed.item, e as MouseEvent);
      });
      itemEl.addEventListener('mouseleave', () => this.hideTooltip());
    });
  }

  private renderEquippedSlot(slot: EquipSlot): string {
    const item = this.inventory.equipped.get(slot);
    if (!item) {
      return `<div class="empty-slot-label">${slot.replace('_', ' ').toUpperCase()}</div>`;
    }
    const qualityClass = `quality-${item.quality}`;
    return `<div class="equipped-item ${qualityClass}">${item.icon}</div>`;
  }

  private renderBackpackGrid(): string {
    let cellsHtml = '';
    // Empty background cells
    for (let r = 0; r < INVENTORY_ROWS; r++) {
      for (let c = 0; c < INVENTORY_COLS; c++) {
        cellsHtml += `<div class="grid-cell" data-col="${c}" data-row="${r}"></div>`;
      }
    }

    // Overlaid placed items
    let itemsHtml = '';
    for (const placed of this.inventory.placedItems) {
      const it = placed.item;
      const left = placed.col * 28;
      const top = placed.row * 28;
      const w = it.width * 28 - 2;
      const h = it.height * 28 - 2;
      const qualityClass = `quality-${it.quality}`;

      itemsHtml += `
        <div class="placed-item-widget ${qualityClass}"
             data-item-id="${it.id}"
             style="left: ${left}px; top: ${top}px; width: ${w}px; height: ${h}px;">
          <span class="item-icon">${it.icon}</span>
        </div>
      `;
    }

    return cellsHtml + itemsHtml;
  }

  private showTooltip(item: Item, e: MouseEvent): void {
    const qualityClass = `quality-${item.quality}`;
    let statsHtml = '';

    if (item.dmgMin && item.dmgMax) statsHtml += `<div>Damage: ${item.dmgMin} - ${item.dmgMax}</div>`;
    if (item.armorClass) statsHtml += `<div>Armor Class: ${item.armorClass}</div>`;
    if (item.bonusToHit) statsHtml += `<div class="magic-text">To-Hit: +${item.bonusToHit}%</div>`;
    if (item.bonusStr) statsHtml += `<div class="magic-text">+${item.bonusStr} to Strength</div>`;
    if (item.bonusDex) statsHtml += `<div class="magic-text">+${item.bonusDex} to Dexterity</div>`;
    if (item.bonusMag) statsHtml += `<div class="magic-text">+${item.bonusMag} to Magic</div>`;
    if (item.bonusVit) statsHtml += `<div class="magic-text">+${item.bonusVit} to Vitality</div>`;
    if (item.bonusHp) statsHtml += `<div class="magic-text">+${item.bonusHp} to Life</div>`;
    if (item.bonusMana) statsHtml += `<div class="magic-text">+${item.bonusMana} to Mana</div>`;
    if (item.lifesteal) statsHtml += `<div class="magic-text">${item.lifesteal}% Life Stolen per Hit</div>`;

    if (item.reqStr) statsHtml += `<div class="req-text">Required Strength: ${item.reqStr}</div>`;
    if (item.reqDex) statsHtml += `<div class="req-text">Required Dexterity: ${item.reqDex}</div>`;

    this.tooltipEl.innerHTML = `
      <div class="tooltip-title ${qualityClass}">${item.name}</div>
      <div class="tooltip-type">${item.baseName} (${item.quality.toUpperCase()})</div>
      <div class="tooltip-stats">${statsHtml}</div>
      ${item.flavorText ? `<div class="tooltip-flavor">"${item.flavorText}"</div>` : ''}
      <div class="tooltip-value">🪙 Value: ${item.value} Gold</div>
    `;

    this.tooltipEl.classList.remove('hidden');
    this.tooltipEl.style.left = `${e.clientX + 15}px`;
    this.tooltipEl.style.top = `${e.clientY - 20}px`;
  }

  private hideTooltip(): void {
    this.tooltipEl.classList.add('hidden');
  }
}
