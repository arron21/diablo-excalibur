import { eventBus } from '../core/events';

export class FloatingTextManager {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'floating-text-container';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.overflow = 'hidden';
    this.container.style.zIndex = '50';
    document.body.appendChild(this.container);

    eventBus.on('combat:floatingText', (data) => {
      this.spawnText(data.text, data.x, data.y, data.color);
    });
  }

  spawnText(text: string, worldX: number, worldY: number, color: string = '#ffffff'): void {
    const el = document.createElement('div');
    el.className = 'floating-combat-text';
    el.innerText = text;
    el.style.color = color;

    // Convert world coordinate to screen coordinate if engine camera available or approximate center
    const screenX = window.innerWidth / 2 + (worldX - (window as any).__cameraX || 0);
    const screenY = window.innerHeight / 2 + (worldY - (window as any).__cameraY || 0);

    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;

    this.container.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 1200);
  }
}
