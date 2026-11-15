import type { CityDef } from '@/content/schemas';

export interface DifficultySnapshot {
  /** Progression de 0 à 1. */
  t: number;
  /** Niveau des notifications autorisées (1 à 3). */
  level: 1 | 2 | 3;
  speed: number;
  patternGap: number;
  notificationInterval: number;
  ttlScale: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Courbe de difficulté d'une ville en fonction du temps de jeu.
 * `start` (0 à 1) avance le point de départ sur la courbe (mode test « avancé »).
 * Courbe en « ease-in » : on reste tranquille au début, ça s'accélère ensuite.
 */
export function difficultyAt(city: CityDef, time: number, start = 0): DifficultySnapshot {
  const linear = Math.min(1, Math.max(0, start + time / city.curve.rampSeconds));
  const t = linear * linear * (3 - 2 * linear); // smoothstep
  const level: 1 | 2 | 3 = t < 0.25 ? 1 : t < 0.6 ? 2 : 3;
  const c = city.curve;
  return {
    t,
    level,
    speed: lerp(c.speedStart, c.speedMax, t),
    patternGap: lerp(c.patternGapStart, c.patternGapMin, t),
    notificationInterval: lerp(c.notificationIntervalStart, c.notificationIntervalMin, t),
    ttlScale: lerp(1, c.ttlScaleEnd, t),
  };
}
