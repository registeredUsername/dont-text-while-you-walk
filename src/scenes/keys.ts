import type { GameStats } from '@/core/types';

/** Noms des scènes et clés du registre partagé entre scènes. */
export const SCENES = {
  boot: 'Boot',
  menu: 'Menu',
  game: 'Game',
  gameOver: 'GameOver',
} as const;

export const REGISTRY = {
  content: 'content',
  debug: 'debugParams',
} as const;

export interface GameSceneData {
  cityId: string;
  seed?: number;
  /** Difficulté de départ (0 à 1), voir le réglage « Départ » du menu. */
  startDifficulty?: number;
  /** Invincible (réglage de test). */
  god?: boolean;
}

export interface GameOverData {
  cityId: string;
  startDifficulty: number;
  god: boolean;
  seed: number;
  score: number;
  distance: number;
  time: number;
  stats: GameStats;
}
