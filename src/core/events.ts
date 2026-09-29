export type GameEventMap = {
  'player:damaged': { currentHp: number; maxHp: number; damage: number };
  'player:healed': { currentHp: number; maxHp: number; amount: number };
  'player:manaChanged': { currentMana: number; maxMana: number };
  'player:leveledUp': { level: number; unspentPoints: number };
  'player:statsChanged': void;
  'inventory:changed': void;
  'item:pickup': { name: string; quality: string };
  'item:drop': { name: string };
  'monster:killed': { name: string; xp: number; col: number; row: number };
  'boss:aggro': { name: string; roar: string };
  'combat:floatingText': { text: string; x: number; y: number; color: string };
  'scene:change': { targetScene: string; spawnCoord?: { col: number; row: number } };
  'vendor:open': { npcId: string };
  'vendor:close': void;
  'ui:toggleWindow': { windowName: 'character' | 'inventory' | 'spellbook' | 'vendor' };
};

type EventCallback<T> = (data: T) => void;

class EventBus {
  private listeners: Map<keyof GameEventMap, Set<EventCallback<any>>> = new Map();

  on<K extends keyof GameEventMap>(event: K, callback: EventCallback<GameEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof GameEventMap>(event: K, callback: EventCallback<GameEventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${String(event)}:`, err);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
