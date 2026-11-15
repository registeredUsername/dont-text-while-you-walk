import { loadNumber, saveNumber } from './storage';

/**
 * Réglages de test accessibles depuis le menu (mémorisés sur l'appareil).
 * Le niveau de départ place la partie directement plus loin sur la courbe de difficulté.
 */
export const START_LEVELS = [
  { label: 'Normal', value: 0 },
  { label: 'Avancé', value: 0.6 },
  { label: 'Chaos', value: 1 },
] as const;

export function loadStartLevelIndex(): number {
  const i = loadNumber('settings:startLevel', 0);
  return i >= 0 && i < START_LEVELS.length ? i : 0;
}

export function saveStartLevelIndex(index: number): void {
  saveNumber('settings:startLevel', index);
}

export function loadGodMode(): boolean {
  return loadNumber('settings:god', 0) === 1;
}

export function saveGodMode(value: boolean): void {
  saveNumber('settings:god', value ? 1 : 0);
}
