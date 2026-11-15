/**
 * Générateur pseudo-aléatoire à graine (mulberry32).
 * Toute la logique du jeu passe par ici : même graine = même partie.
 * Ne jamais utiliser Math.random() dans src/core (règle ESLint).
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Nombre dans [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Réel dans [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Entier dans [min, max] (bornes incluses). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick sur une liste vide');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Tirage pondéré. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    const total = items.reduce((sum, item) => sum + weight(item), 0);
    if (items.length === 0 || total <= 0) throw new Error('Rng.weighted : rien à tirer');
    let roll = this.next() * total;
    for (const item of items) {
      roll -= weight(item);
      if (roll < 0) return item;
    }
    return items[items.length - 1] as T;
  }
}

/** Graine aléatoire pour une nouvelle partie (hors du cœur, donc Math.random autorisé). */
export function randomSeed(source: () => number): number {
  return Math.floor(source() * 2 ** 31);
}
