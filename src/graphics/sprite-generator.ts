import { TILE_WIDTH, TILE_HEIGHT } from '../core/constants';
import { TileType } from '../dungeon/dungeon-types';
import { Direction8 } from '../core/isometric';

export class SpriteGenerator {
  private static canvasCache: Map<string, HTMLCanvasElement> = new Map();
  public static customImages: Map<string, HTMLImageElement> = new Map();

  static async loadCustomImage(name: string, src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        SpriteGenerator.customImages.set(name, img);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  private static createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
  }

  /**
   * Generates or retrieves an isometric tile canvas.
   */
  static getTileSprite(tileType: TileType): HTMLCanvasElement {
    const key = `tile_${tileType}`;
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const [canvas, ctx] = this.createCanvas(TILE_WIDTH, TILE_HEIGHT + 32);
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    const yOffset = 32; // Elevation space for walls

    // Path helper for standard isometric diamond
    const drawDiamond = (offsetY: number) => {
      ctx.beginPath();
      ctx.moveTo(halfW, offsetY);
      ctx.lineTo(TILE_WIDTH, offsetY + halfH);
      ctx.lineTo(halfW, offsetY + TILE_HEIGHT);
      ctx.lineTo(0, offsetY + halfH);
      ctx.closePath();
    };

    switch (tileType) {
      case TileType.FLOOR: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#2c2b29';
        ctx.fill();
        ctx.strokeStyle = '#181715';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Flagstone paver lines
        ctx.strokeStyle = '#22211f';
        ctx.beginPath();
        ctx.moveTo(halfW, yOffset + 6);
        ctx.lineTo(halfW + 14, yOffset + halfH);
        ctx.moveTo(halfW - 12, yOffset + halfH);
        ctx.lineTo(halfW, yOffset + TILE_HEIGHT - 6);
        ctx.stroke();
        break;
      }

      case TileType.FLOOR_BLOOD: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#3a1818';
        ctx.fill();
        ctx.strokeStyle = '#1e0c0c';
        ctx.stroke();

        // Blood splatters
        ctx.fillStyle = '#881111';
        ctx.beginPath();
        ctx.arc(halfW - 4, yOffset + halfH, 6, 0, Math.PI * 2);
        ctx.arc(halfW + 8, yOffset + halfH - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.COBBLE: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#474540';
        ctx.fill();
        ctx.strokeStyle = '#2a2824';
        ctx.stroke();

        // Cobblestones
        ctx.fillStyle = '#5a5752';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(halfW - 10 + i * 5, yOffset + halfH - 4 + (i % 2) * 8, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case TileType.GRASS: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#23381e';
        ctx.fill();
        ctx.strokeStyle = '#162413';
        ctx.stroke();

        // Grass blades
        ctx.strokeStyle = '#3b5c33';
        ctx.beginPath();
        ctx.moveTo(halfW - 5, yOffset + halfH);
        ctx.lineTo(halfW - 3, yOffset + halfH - 4);
        ctx.moveTo(halfW + 6, yOffset + halfH + 2);
        ctx.lineTo(halfW + 8, yOffset + halfH - 3);
        ctx.stroke();
        break;
      }

      case TileType.WATER: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#1e3a5f';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.stroke();

        // Water ripples
        ctx.strokeStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(halfW, yOffset + halfH, 8, 0, Math.PI);
        ctx.stroke();
        break;
      }

      case TileType.WALL_N: {
        // Floor base
        drawDiamond(yOffset);
        ctx.fillStyle = '#1c1b1a';
        ctx.fill();

        // Wall extruded upward from North edge
        ctx.beginPath();
        ctx.moveTo(0, yOffset + halfH);
        ctx.lineTo(halfW, yOffset);
        ctx.lineTo(halfW, 0);
        ctx.lineTo(0, halfH);
        ctx.closePath();
        ctx.fillStyle = '#43413d';
        ctx.fill();
        ctx.strokeStyle = '#181715';
        ctx.stroke();

        // Wall top face
        ctx.beginPath();
        ctx.moveTo(0, halfH);
        ctx.lineTo(halfW, 0);
        ctx.lineTo(halfW + 6, 3);
        ctx.lineTo(6, halfH + 3);
        ctx.closePath();
        ctx.fillStyle = '#5c5954';
        ctx.fill();
        break;
      }

      case TileType.WALL_W: {
        // Floor base
        drawDiamond(yOffset);
        ctx.fillStyle = '#1c1b1a';
        ctx.fill();

        // Wall extruded upward from West edge
        ctx.beginPath();
        ctx.moveTo(halfW, yOffset);
        ctx.lineTo(TILE_WIDTH, yOffset + halfH);
        ctx.lineTo(TILE_WIDTH, halfH);
        ctx.lineTo(halfW, 0);
        ctx.closePath();
        ctx.fillStyle = '#353330';
        ctx.fill();
        ctx.strokeStyle = '#181715';
        ctx.stroke();

        // Wall top face
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(TILE_WIDTH, halfH);
        ctx.lineTo(TILE_WIDTH - 6, halfH + 3);
        ctx.lineTo(halfW - 6, 3);
        ctx.closePath();
        ctx.fillStyle = '#4c4945';
        ctx.fill();
        break;
      }

      case TileType.WALL_CORNER: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#1c1b1a';
        ctx.fill();

        // West wall
        ctx.beginPath();
        ctx.moveTo(0, yOffset + halfH);
        ctx.lineTo(halfW, yOffset);
        ctx.lineTo(halfW, 0);
        ctx.lineTo(0, halfH);
        ctx.closePath();
        ctx.fillStyle = '#43413d';
        ctx.fill();

        // East wall
        ctx.beginPath();
        ctx.moveTo(halfW, yOffset);
        ctx.lineTo(TILE_WIDTH, yOffset + halfH);
        ctx.lineTo(TILE_WIDTH, halfH);
        ctx.lineTo(halfW, 0);
        ctx.closePath();
        ctx.fillStyle = '#353330';
        ctx.fill();
        ctx.strokeStyle = '#181715';
        ctx.stroke();
        break;
      }

      case TileType.DOOR_CLOSED: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#222';
        ctx.fill();

        // Heavy oak door
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(halfW - 12, yOffset - 16, 24, 32);
        ctx.strokeStyle = '#2b1b0f';
        ctx.strokeRect(halfW - 12, yOffset - 16, 24, 32);

        // Iron bands & handle
        ctx.fillStyle = '#71717a';
        ctx.fillRect(halfW - 12, yOffset - 10, 24, 3);
        ctx.fillRect(halfW - 12, yOffset + 4, 24, 3);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(halfW + 6, yOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TileType.DOOR_OPEN: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#2c2b29';
        ctx.fill();

        // Open door frame
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 3;
        ctx.strokeRect(halfW - 14, yOffset - 16, 28, 32);

        // Door swung ajar
        ctx.fillStyle = '#452b19';
        ctx.fillRect(halfW + 10, yOffset - 14, 6, 28);
        break;
      }

      case TileType.STAIRS_DOWN: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#181715';
        ctx.fill();

        // Descending stone steps
        ctx.fillStyle = '#3f3e3a';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(halfW - 14 + i * 4, yOffset + 6 + i * 5, 28 - i * 8, 4);
        }
        break;
      }

      case TileType.STAIRS_UP: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#2a2825';
        ctx.fill();

        // Ascending stone steps with light
        ctx.fillStyle = '#6b675e';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(halfW - 14 + i * 4, yOffset + 20 - i * 5, 28 - i * 8, 4);
        }
        break;
      }

      default: {
        drawDiamond(yOffset);
        ctx.fillStyle = '#111';
        ctx.fill();
        break;
      }
    }

    this.canvasCache.set(key, canvas);
    return canvas;
  }

  /**
   * Generates character and monster sprites for 8 directions and states.
   */
  static getEntitySprite(
    type: 'warrior' | 'rogue' | 'sorcerer' | 'skeleton' | 'archer' | 'scavenger' | 'butcher',
    state: string,
    facing: Direction8,
    frame: number = 0
  ): HTMLCanvasElement {
    const key = `entity_${type}_${state}_${facing}_${frame}`;
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const w = type === 'butcher' ? 56 : 40;
    const h = type === 'butcher' ? 64 : 48;
    const [canvas, ctx] = this.createCanvas(w, h);

    const cx = w / 2;
    const cy = h / 2 + 6;

    // Subtle breathing or walking stride offset
    const bounce = state === 'walk' ? Math.sin(frame * Math.PI) * 2 : 0;
    const hurtFlash = state === 'hurt';

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, w * 0.35, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (type) {
      case 'warrior': {
        // Legs & Boots
        ctx.fillStyle = hurtFlash ? '#ef4444' : '#3f3f46';
        ctx.fillRect(cx - 6, cy + 4 - bounce, 4, 8);
        ctx.fillRect(cx + 2, cy + 4 + bounce, 4, 8);

        // Body / Plate Armor
        ctx.fillStyle = hurtFlash ? '#f87171' : '#71717a';
        ctx.fillRect(cx - 8, cy - 8, 16, 14);
        // Crimson cape
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx - 9, cy - 7, 3, 15);

        // Helm & Face
        ctx.fillStyle = hurtFlash ? '#f87171' : '#a1a1aa';
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        // Visor slit
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 3, cy - 13, 6, 2);

        // Shield (left)
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(cx - 12, cy - 6, 4, 10);
        ctx.strokeStyle = '#eab308';
        ctx.strokeRect(cx - 12, cy - 6, 4, 10);

        // Sword (right)
        if (state === 'attack') {
          // Swing slash
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx + 8, cy - 4, 14, -Math.PI / 4, Math.PI / 3);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + 9, cy + 4);
          ctx.lineTo(cx + 14, cy - 10);
          ctx.stroke();
        }
        break;
      }

      case 'rogue': {
        // Legs
        ctx.fillStyle = hurtFlash ? '#ef4444' : '#14532d';
        ctx.fillRect(cx - 5, cy + 4 - bounce, 3, 8);
        ctx.fillRect(cx + 2, cy + 4 + bounce, 3, 8);

        // Leather Tunic
        ctx.fillStyle = hurtFlash ? '#f87171' : '#166534';
        ctx.fillRect(cx - 6, cy - 8, 12, 13);

        // Hood & Face
        ctx.fillStyle = hurtFlash ? '#f87171' : '#15803d';
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(cx - 2, cy - 12, 4, 3);

        // Bow
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 4, 10, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        break;
      }

      case 'sorcerer': {
        // Blue Robe
        ctx.fillStyle = hurtFlash ? '#ef4444' : '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 9, cy + 12);
        ctx.lineTo(cx - 9, cy + 12);
        ctx.closePath();
        ctx.fill();

        // Golden Trim
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hood
        ctx.fillStyle = hurtFlash ? '#f87171' : '#172554';
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 5, 0, Math.PI * 2);
        ctx.fill();

        // Arcane Staff
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy + 12);
        ctx.lineTo(cx + 10, cy - 16);
        ctx.stroke();
        // Crystal top
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 17, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'skeleton': {
        // Bone limbs
        ctx.fillStyle = hurtFlash ? '#ef4444' : '#e4e4e7';
        ctx.fillRect(cx - 5, cy + 3 - bounce, 2, 9);
        ctx.fillRect(cx + 3, cy + 3 + bounce, 2, 9);

        // Ribcage
        ctx.fillRect(cx - 6, cy - 7, 12, 9);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(cx - 4, cy - 5, 8, 2);
        ctx.fillRect(cx - 4, cy - 2, 8, 2);

        // Skull
        ctx.fillStyle = hurtFlash ? '#f87171' : '#f4f4f5';
        ctx.beginPath();
        ctx.arc(cx, cy - 11, 5, 0, Math.PI * 2);
        ctx.fill();
        // Eye sockets
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - 3, cy - 12, 2, 2);
        ctx.fillRect(cx + 1, cy - 12, 2, 2);

        // Rusted blade
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 7, cy + 2);
        ctx.lineTo(cx + 13, cy - 8);
        ctx.stroke();
        break;
      }

      case 'archer': {
        // Similar to skeleton but holding bow
        ctx.fillStyle = hurtFlash ? '#ef4444' : '#d4d4d8';
        ctx.fillRect(cx - 5, cy + 3 - bounce, 2, 9);
        ctx.fillRect(cx + 3, cy + 3 + bounce, 2, 9);

        ctx.fillRect(cx - 5, cy - 6, 10, 8);
        ctx.beginPath();
        ctx.arc(cx, cy - 11, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - 3, cy - 12, 2, 2);
        ctx.fillRect(cx + 1, cy - 12, 2, 2);

        // Bone bow
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 4, 8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        break;
      }

      case 'scavenger': {
        // Small red imp
        ctx.fillStyle = hurtFlash ? '#ffffff' : '#b91c1c';
        ctx.fillRect(cx - 4, cy + 2 - bounce, 2, 7);
        ctx.fillRect(cx + 2, cy + 2 + bounce, 2, 7);

        // Body
        ctx.fillRect(cx - 5, cy - 5, 10, 8);
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        // Horns
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 11);
        ctx.lineTo(cx - 4, cy - 14);
        ctx.moveTo(cx + 2, cy - 11);
        ctx.lineTo(cx + 4, cy - 14);
        ctx.stroke();
        // Spiked Club
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 6, cy - 4, 3, 9);
        break;
      }

      case 'butcher': {
        // Massive Ogre Frame
        ctx.fillStyle = hurtFlash ? '#fca5a5' : '#7f1d1d';
        // Huge legs
        ctx.fillRect(cx - 10, cy + 6 - bounce, 7, 10);
        ctx.fillRect(cx + 3, cy + 6 + bounce, 7, 10);

        // Colossal Torso
        ctx.fillStyle = hurtFlash ? '#f87171' : '#991b1b';
        ctx.fillRect(cx - 16, cy - 14, 32, 22);

        // Bloody Butcher Apron
        ctx.fillStyle = '#e4e4e7';
        ctx.fillRect(cx - 11, cy - 10, 22, 19);
        // Blood splatters on apron
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(cx - 7, cy - 6, 6, 8);
        ctx.fillRect(cx + 2, cy - 2, 7, 6);

        // Grotesque Horned Head
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 9, 0, Math.PI * 2);
        ctx.fill();
        // Glowing red eyes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 5, cy - 20, 3, 2);
        ctx.fillRect(cx + 2, cy - 20, 3, 2);

        // Giant Meat Cleaver
        ctx.fillStyle = '#52525b';
        ctx.fillRect(cx + 15, cy - 18, 10, 16);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 17, cy - 2, 4, 10);
        // Blood on blade
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx + 22, cy - 18, 3, 16);
        break;
      }
    }

    this.canvasCache.set(key, canvas);
    return canvas;
  }
}
