import { Player } from '../entities/player';
import { InventoryManager } from '../items/inventory';
import { SPELLS } from '../spells/spell-types';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';

export class GothicHUD {
  private element: HTMLElement;
  private player: Player;
  private inventory: InventoryManager;

  constructor(player: Player, inventory: InventoryManager) {
    this.player = player;
    this.inventory = inventory;

    this.element = document.createElement('div');
    this.element.id = 'gothic-hud';
    document.body.appendChild(this.element);

    eventBus.on('player:damaged', () => this.updateOrbs());
    eventBus.on('player:healed', () => this.updateOrbs());
    eventBus.on('player:manaChanged', () => this.updateOrbs());
    eventBus.on('player:leveledUp', () => this.render());
    eventBus.on('player:statsChanged', () => this.updateOrbs());
    eventBus.on('inventory:changed', () => this.updateBelt());

    this.render();
  }

  setContext(player: Player, inventory: InventoryManager): void {
    this.player = player;
    this.inventory = inventory;
    this.render();
  }

  render(): void {
    const s = this.player.stats;
    const hpPct = Math.max(0, Math.min(100, (s.currentHp / s.getMaxHp()) * 100));
    const manaPct = Math.max(0, Math.min(100, (s.currentMana / s.getMaxMana()) * 100));
    const xpPct = Math.min(100, (s.xp / s.getXpForNextLevel()) * 100);

    const activeSpell = SPELLS[this.player.activeSpellId] || SPELLS.firebolt;

    this.element.innerHTML = `
      <!-- Red Health Orb -->
      <div class="orb-container life-orb-wrapper" id="health-orb-wrap" title="Life: ${s.currentHp} / ${s.getMaxHp()}">
        <div class="orb-glass"></div>
        <div class="orb-fluid life-fluid" id="life-fluid-el" style="height: ${hpPct}%;"></div>
        <div class="orb-highlight"></div>
        <div class="orb-text">${s.currentHp}</div>
      </div>

      <!-- Center Console -->
      <div class="console-panel">
        <div class="belt-bar">
          ${this.renderBeltSlots()}
        </div>

        <div class="action-buttons-row">
          <button class="hud-btn" id="btn-char" title="Character Sheet [C]">
            <span class="btn-hotkey">[C]</span> ATTRIB
            ${s.unspentStatPoints > 0 ? `<span class="badge-dot"></span>` : ''}
          </button>
          <button class="hud-btn" id="btn-inv" title="Inventory [I]">
            <span class="btn-hotkey">[I]</span> INVENT
          </button>
          <button class="hud-btn" id="btn-spells" title="Select Spell [S]">
            <span class="btn-hotkey">[S]</span> SPELL
          </button>
          <button class="hud-btn" id="btn-sound" title="Toggle Music">
            ${soundSynth.musicEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        <!-- Active Spell Display -->
        <div class="active-spell-container" id="spell-selector-btn" title="Right-Click Spell: ${activeSpell.name}">
          <span class="spell-icon">${activeSpell.icon}</span>
          <span class="spell-name">${activeSpell.name}</span>
          <span class="spell-cost">(${activeSpell.manaCost} MP)</span>
        </div>

        <!-- Experience Bar -->
        <div class="xp-bar-container" title="XP: ${s.xp} / ${s.getXpForNextLevel()}">
          <div class="xp-bar-fill" style="width: ${xpPct}%;"></div>
        </div>
      </div>

      <!-- Blue Mana Orb -->
      <div class="orb-container mana-orb-wrapper" id="mana-orb-wrap" title="Mana: ${s.currentMana} / ${s.getMaxMana()}">
        <div class="orb-glass"></div>
        <div class="orb-fluid mana-fluid" id="mana-fluid-el" style="height: ${manaPct}%;"></div>
        <div class="orb-highlight"></div>
        <div class="orb-text">${s.currentMana}</div>
      </div>

      <!-- Spell Selector Menu (Hidden by default) -->
      <div class="spell-menu-dropdown hidden" id="spell-menu-dropdown">
        ${Object.values(SPELLS)
          .map(
            (sp) => `
          <div class="spell-menu-item ${this.player.activeSpellId === sp.id ? 'active' : ''}" data-spell-id="${sp.id}">
            <span class="s-icon">${sp.icon}</span>
            <div class="s-desc">
              <span class="s-title">${sp.name}</span>
              <span class="s-info">${sp.manaCost} Mana • Req Mag ${sp.minMagicReq}</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    this.bindEvents();
  }

  private renderBeltSlots(): string {
    let html = '';
    for (let i = 0; i < 4; i++) {
      const item = this.inventory.belt[i];
      html += `
        <div class="belt-slot" data-belt-idx="${i}" title="${item ? item.name : 'Empty Slot'}">
          <span class="belt-num">${i + 1}</span>
          ${item ? `<span class="belt-item-icon">${item.icon}</span>` : ''}
        </div>
      `;
    }
    return html;
  }

  private bindEvents(): void {
    this.element.querySelector('#btn-char')?.addEventListener('click', () => {
      eventBus.emit('ui:toggleWindow', { windowName: 'character' });
    });

    this.element.querySelector('#btn-inv')?.addEventListener('click', () => {
      eventBus.emit('ui:toggleWindow', { windowName: 'inventory' });
    });

    this.element.querySelector('#btn-sound')?.addEventListener('click', () => {
      soundSynth.toggleMusic();
      this.render();
    });

    const spellMenu = this.element.querySelector('#spell-menu-dropdown') as HTMLElement;
    this.element.querySelector('#btn-spells')?.addEventListener('click', () => {
      spellMenu.classList.toggle('hidden');
    });

    this.element.querySelector('#spell-selector-btn')?.addEventListener('click', () => {
      spellMenu.classList.toggle('hidden');
    });

    this.element.querySelectorAll('.spell-menu-item').forEach((itemEl) => {
      itemEl.addEventListener('click', (e) => {
        const spellId = itemEl.getAttribute('data-spell-id');
        if (spellId) {
          this.player.activeSpellId = spellId;
          soundSynth.playSpellCast(spellId);
          spellMenu.classList.add('hidden');
          this.render();
        }
      });
    });

    // Belt click triggers consumption
    this.element.querySelectorAll('.belt-slot').forEach((slotEl) => {
      slotEl.addEventListener('click', () => {
        const idx = parseInt(slotEl.getAttribute('data-belt-idx') || '0');
        const used = this.inventory.useBeltSlot(idx, this.player);
        if (used) soundSynth.playPotion();
      });
    });
  }

  public updateOrbs(): void {
    const s = this.player.stats;
    const hpPct = Math.max(0, Math.min(100, (s.currentHp / s.getMaxHp()) * 100));
    const manaPct = Math.max(0, Math.min(100, (s.currentMana / s.getMaxMana()) * 100));

    const lifeFluid = this.element.querySelector('#life-fluid-el') as HTMLElement;
    const manaFluid = this.element.querySelector('#mana-fluid-el') as HTMLElement;
    const lifeWrap = this.element.querySelector('#health-orb-wrap') as HTMLElement;
    const manaWrap = this.element.querySelector('#mana-orb-wrap') as HTMLElement;

    if (lifeFluid) lifeFluid.style.height = `${hpPct}%`;
    if (manaFluid) manaFluid.style.height = `${manaPct}%`;

    const lifeText = this.element.querySelector('.life-orb-wrapper .orb-text') as HTMLElement;
    const manaText = this.element.querySelector('.mana-orb-wrapper .orb-text') as HTMLElement;
    if (lifeText) lifeText.innerText = `${s.currentHp}`;
    if (manaText) manaText.innerText = `${s.currentMana}`;

    if (lifeWrap) lifeWrap.title = `Life: ${s.currentHp} / ${s.getMaxHp()}`;
    if (manaWrap) manaWrap.title = `Mana: ${s.currentMana} / ${s.getMaxMana()}`;
  }

  public updateBelt(): void {
    const beltBar = this.element.querySelector('.belt-bar');
    if (beltBar) {
      beltBar.innerHTML = this.renderBeltSlots();
      beltBar.querySelectorAll('.belt-slot').forEach((slotEl) => {
        slotEl.addEventListener('click', () => {
          const idx = parseInt(slotEl.getAttribute('data-belt-idx') || '0');
          const used = this.inventory.useBeltSlot(idx, this.player);
          if (used) soundSynth.playPotion();
        });
      });
    }
  }
}
