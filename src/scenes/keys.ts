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
}

export interface GameOverData {
  cityId: string;
  seed: number;
  score: number;
  distance: number;
  time: number;
  stats: GameStats;
}
