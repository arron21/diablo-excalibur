import { Player } from '../entities/player';
import { eventBus } from '../core/events';
import { soundSynth } from '../audio/sound-synth';

export class CharacterSheetUI {
  private element: HTMLElement;
  private player: Player;
  public isVisible: boolean = false;

  constructor(player: Player) {
    this.player = player;
    this.element = document.createElement('div');
    this.element.id = 'character-sheet-window';
    this.element.className = 'gothic-window hidden';
    document.body.appendChild(this.element);

    eventBus.on('ui:toggleWindow', (data) => {
      if (data.windowName === 'character') {
        this.toggle();
      }
    });

    eventBus.on('player:statsChanged', () => {
      if (this.isVisible) this.render();
    });

    eventBus.on('player:leveledUp', () => {
      if (this.isVisible) this.render();
    });

    this.render();
  }

  setPlayer(player: Player): void {
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
    }
  }

  render(): void {
    const s = this.player.stats;
    const dmg = s.getDamage();

    this.element.innerHTML = `
      <div class="window-header">
        <span class="window-title">CHARACTER ATTRIBUTES</span>
        <button class="close-btn" id="close-char-sheet">✕</button>
      </div>

      <div class="char-class-banner">
        <span class="char-name">${s.charClass.toUpperCase()}</span>
        <span class="char-level">LEVEL ${s.level}</span>
      </div>

      <div class="attributes-section">
        <div class="section-title">CORE ATTRIBUTES</div>
        ${s.unspentStatPoints > 0 ? `<div class="unspent-badge">POINTS REMAINING: ${s.unspentStatPoints}</div>` : ''}

        <div class="stat-row">
          <span class="stat-label">STRENGTH:</span>
          <span class="stat-val ${s.bonusStr > 0 ? 'magic-text' : ''}">${s.totalStrength}</span>
          ${s.unspentStatPoints > 0 ? `<button class="alloc-btn" data-stat="strength">+</button>` : ''}
        </div>

        <div class="stat-row">
          <span class="stat-label">MAGIC:</span>
          <span class="stat-val ${s.bonusMag > 0 ? 'magic-text' : ''}">${s.totalMagic}</span>
          ${s.unspentStatPoints > 0 ? `<button class="alloc-btn" data-stat="magic">+</button>` : ''}
        </div>

        <div class="stat-row">
          <span class="stat-label">DEXTERITY:</span>
          <span class="stat-val ${s.bonusDex > 0 ? 'magic-text' : ''}">${s.totalDexterity}</span>
          ${s.unspentStatPoints > 0 ? `<button class="alloc-btn" data-stat="dexterity">+</button>` : ''}
        </div>

        <div class="stat-row">
          <span class="stat-label">VITALITY:</span>
          <span class="stat-val ${s.bonusVit > 0 ? 'magic-text' : ''}">${s.totalVitality}</span>
          ${s.unspentStatPoints > 0 ? `<button class="alloc-btn" data-stat="vitality">+</button>` : ''}
        </div>
      </div>

      <div class="combat-stats-section">
        <div class="section-title">COMBAT RATINGS</div>
        <div class="stat-row"><span class="stat-label">DAMAGE:</span> <span class="stat-val">${dmg.min} - ${dmg.max}</span></div>
        <div class="stat-row"><span class="stat-label">TO-HIT:</span> <span class="stat-val">${s.getToHit()}%</span></div>
        <div class="stat-row"><span class="stat-label">ARMOR CLASS:</span> <span class="stat-val ${s.bonusAc > 0 ? 'magic-text' : ''}">${s.getArmorClass()}</span></div>
        <div class="stat-row"><span class="stat-label">BLOCK CHANCE:</span> <span class="stat-val">${s.getBlockChance()}%</span></div>
        <div class="stat-row"><span class="stat-label">MAX LIFE:</span> <span class="stat-val life-text">${s.getMaxHp()}</span></div>
        <div class="stat-row"><span class="stat-label">MAX MANA:</span> <span class="stat-val mana-text">${s.getMaxMana()}</span></div>
        <div class="stat-row"><span class="stat-label">EXPERIENCE:</span> <span class="stat-val">${s.xp} / ${s.getXpForNextLevel()}</span></div>
      </div>
    `;

    // Bind close
    this.element.querySelector('#close-char-sheet')?.addEventListener('click', () => {
      this.toggle();
    });

    // Bind stat allocation buttons
    this.element.querySelectorAll('.alloc-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const statName = (e.target as HTMLElement).getAttribute('data-stat') as any;
        if (statName) {
          const success = s.allocateStat(statName);
          if (success) {
            soundSynth.playLevelUp();
            eventBus.emit('player:statsChanged', undefined);
            this.render();
          }
        }
      });
    });
  }
}
