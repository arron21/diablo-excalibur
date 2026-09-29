export type CharacterClass = 'warrior' | 'rogue' | 'sorcerer';

export interface AttributeStats {
  strength: number;
  magic: number;
  dexterity: number;
  vitality: number;
}

export const CLASS_INITIAL_ATTRIBUTES: Record<CharacterClass, AttributeStats> = {
  warrior: {
    strength: 30,
    magic: 10,
    dexterity: 20,
    vitality: 25,
  },
  rogue: {
    strength: 20,
    magic: 15,
    dexterity: 30,
    vitality: 20,
  },
  sorcerer: {
    strength: 15,
    magic: 35,
    dexterity: 15,
    vitality: 20,
  },
};

export class CharacterStats {
  public charClass: CharacterClass;
  public level: number = 1;
  public xp: number = 0;
  public unspentStatPoints: number = 0;

  public strength: number;
  public magic: number;
  public dexterity: number;
  public vitality: number;

  public currentHp: number;
  public currentMana: number;

  // Bonus from equipped gear
  public bonusAc: number = 0;
  public bonusToHit: number = 0;
  public bonusDmgMin: number = 0;
  public bonusDmgMax: number = 0;
  public bonusStr: number = 0;
  public bonusMag: number = 0;
  public bonusDex: number = 0;
  public bonusVit: number = 0;
  public bonusMaxHp: number = 0;
  public bonusMaxMana: number = 0;
  public hasShield: boolean = false;
  public baseWeaponDmgMin: number = 2;
  public baseWeaponDmgMax: number = 5;

  constructor(charClass: CharacterClass) {
    this.charClass = charClass;
    const initial = CLASS_INITIAL_ATTRIBUTES[charClass];
    this.strength = initial.strength;
    this.magic = initial.magic;
    this.dexterity = initial.dexterity;
    this.vitality = initial.vitality;

    this.currentHp = this.getMaxHp();
    this.currentMana = this.getMaxMana();
  }

  get totalStrength(): number {
    return this.strength + this.bonusStr;
  }

  get totalMagic(): number {
    return this.magic + this.bonusMag;
  }

  get totalDexterity(): number {
    return this.dexterity + this.bonusDex;
  }

  get totalVitality(): number {
    return this.vitality + this.bonusVit;
  }

  getMaxHp(): number {
    let base = 0;
    if (this.charClass === 'warrior') {
      base = this.totalVitality * 2 + this.level * 2;
    } else if (this.charClass === 'rogue') {
      base = Math.floor(this.totalVitality * 1.5 + this.level * 1.5);
    } else {
      base = this.totalVitality * 1 + this.level * 1;
    }
    return base + this.bonusMaxHp;
  }

  getMaxMana(): number {
    let base = 0;
    if (this.charClass === 'warrior') {
      base = this.totalMagic * 1 + this.level * 1;
    } else if (this.charClass === 'rogue') {
      base = Math.floor(this.totalMagic * 1.5 + this.level * 1.5);
    } else {
      base = this.totalMagic * 2 + this.level * 2;
    }
    return base + this.bonusMaxMana;
  }

  getArmorClass(): number {
    return Math.floor(this.totalDexterity / 5) + this.bonusAc;
  }

  getToHit(): number {
    return 50 + Math.floor(this.totalDexterity / 2) + this.bonusToHit;
  }

  getDamage(): { min: number; max: number } {
    let statBonus = Math.floor(this.totalStrength / 5);
    if (this.charClass === 'rogue') {
      statBonus = Math.floor((this.totalStrength + this.totalDexterity) / 10);
    }
    return {
      min: this.baseWeaponDmgMin + statBonus + this.bonusDmgMin,
      max: this.baseWeaponDmgMax + statBonus + this.bonusDmgMax,
    };
  }

  getBlockChance(): number {
    if (!this.hasShield) return 0;
    let block = Math.floor(this.totalDexterity / 2) + 20;
    if (this.charClass === 'warrior') {
      block += 15; // Warrior shield mastery
    }
    return Math.min(75, block);
  }

  getXpForNextLevel(): number {
    const table = [0, 200, 600, 1500, 3200, 6000, 10000, 16000, 25000];
    if (this.level < table.length) {
      return table[this.level];
    }
    return this.level * 5000;
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.getXpForNextLevel()) {
      this.level++;
      this.unspentStatPoints += 5;
      leveledUp = true;
      // Full heal on level up
      this.currentHp = this.getMaxHp();
      this.currentMana = this.getMaxMana();
    }
    return leveledUp;
  }

  allocateStat(stat: keyof AttributeStats): boolean {
    if (this.unspentStatPoints <= 0) return false;
    this[stat]++;
    this.unspentStatPoints--;
    // Adjust hp/mana if vit or mag changed
    if (stat === 'vitality') {
      this.currentHp = Math.min(this.currentHp + 2, this.getMaxHp());
    } else if (stat === 'magic') {
      this.currentMana = Math.min(this.currentMana + 2, this.getMaxMana());
    }
    return true;
  }

  heal(amount: number): number {
    const before = this.currentHp;
    this.currentHp = Math.min(this.getMaxHp(), this.currentHp + amount);
    return this.currentHp - before;
  }

  restoreMana(amount: number): number {
    const before = this.currentMana;
    this.currentMana = Math.min(this.getMaxMana(), this.currentMana + amount);
    return this.currentMana - before;
  }

  takeDamage(amount: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp <= 0;
  }
}
