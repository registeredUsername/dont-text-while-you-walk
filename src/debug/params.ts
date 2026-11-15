/**
 * Paramètres de debug lus dans l'URL, par exemple :
 *   http://localhost:5173/?debug=1&seed=42&god=1&speed=0.5&city=new-york&start=1
 */
export interface DebugParams {
  /** Affiche l'overlay de debug. */
  debug: boolean;
  /** Graine fixe pour rejouer exactement la même partie. */
  seed: number | null;
  /** Invincible. */
  god: boolean;
  /** Vitesse du temps (0.5 = ralenti). */
  timeScale: number;
  /** Difficulté de départ 0 à 1 (null = celle du menu). */
  start: number | null;
  /** Démarre directement dans cette ville. */
  city: string | null;
  /** Coupe le son. */
  mute: boolean;
}

export function readDebugParams(search: string): DebugParams {
  const p = new URLSearchParams(search);
  const flag = (name: string): boolean =>
    p.has(name) && p.get(name) !== '0' && p.get(name) !== 'false';
  const seed = p.get('seed');
  const speed = Number(p.get('speed') ?? '1');
  const start = p.get('start');
  return {
    debug: flag('debug'),
    seed: seed !== null && Number.isFinite(Number(seed)) ? Number(seed) : null,
    god: flag('god'),
    timeScale: Number.isFinite(speed) && speed > 0 ? Math.min(speed, 4) : 1,
    start:
      start !== null && Number.isFinite(Number(start))
        ? Math.min(1, Math.max(0, Number(start)))
        : null,
    city: p.get('city'),
    mute: flag('mute'),
  };
}
