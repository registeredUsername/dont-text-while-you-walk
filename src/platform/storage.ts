/** Sauvegarde locale minimale. Passera par @capacitor/preferences si besoin en natif. */
const PREFIX = 'dtwyw:';

export function loadNumber(key: string, fallback = 0): number {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function saveNumber(key: string, value: number): void {
  try {
    localStorage.setItem(PREFIX + key, String(value));
  } catch {
    // Navigation privée ou stockage plein : on ignore.
  }
}

export const bestScoreKey = (cityId: string): string => `best:${cityId}`;
