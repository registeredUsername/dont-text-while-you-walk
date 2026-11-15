import type { NotificationDef, ObstacleDef } from '@/content/schemas';

/** Gestes reconnus par le module input. Le cœur décide de leur sens selon l'état du téléphone. */
export type Gesture = 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown' | 'tap' | 'longPress';

export type PhonePosition = 'down' | 'raising' | 'up' | 'lowering';

export interface ObstacleInstance {
  /** Identifiant unique dans la partie (sert au rendu). */
  uid: number;
  def: ObstacleDef;
  /** Couloir le plus à gauche occupé (0 à 2). */
  lane: number;
  /** Position absolue le long de la rue (u). */
  z: number;
  resolved: boolean;
}

export interface NotificationInstance {
  uid: number;
  def: NotificationDef;
  text: string;
  /** Durée de vie totale et restante (s). */
  ttl: number;
  remaining: number;
}

export interface GameStats {
  notificationsAnswered: number;
  notificationsWrong: number;
  notificationsMissed: number;
  collisions: number;
  /** Collisions par type d'obstacle (ex. combien de grand-mères bousculées). */
  collisionsByObstacle: Record<string, number>;
  nearMisses: number;
  pickups: number;
  /** Temps passé téléphone levé (s). */
  screenTime: number;
}

export interface GameState {
  seed: number;
  cityId: string;
  /** Temps de jeu écoulé (s). */
  time: number;
  /** Distance parcourue (u). */
  distance: number;
  /** Vitesse actuelle (u/s). */
  speed: number;
  /** Difficulté de 0 (début) à 1 (maximum). */
  difficulty: number;

  lane: number;
  previousLane: number;
  laneChangedAt: number;
  duckRemaining: number;

  phone: {
    position: PhonePosition;
    /** 0 = baissé, 1 = levé. Sert à l'animation. */
    progress: number;
  };
  /** File de notifications. Index 0 = celle du dessus, la seule interactive. */
  notifications: NotificationInstance[];
  obstacles: ObstacleInstance[];

  lives: number;
  invulnerableRemaining: number;
  stress: number;

  score: number;
  combo: number;
  perfectStreak: number;
  stats: GameStats;
  over: boolean;
}

/** Événements émis par la simulation à chaque pas. Le rendu s'en sert pour le feedback. */
export type GameEvent =
  | { type: 'phoneRaised' }
  | { type: 'phoneLowered' }
  | { type: 'laneChanged'; lane: number; from: number }
  | { type: 'laneBlocked'; direction: -1 | 1 }
  | { type: 'ducked' }
  | { type: 'notificationArrived'; notification: NotificationInstance }
  | {
      type: 'notificationAnswered';
      notification: NotificationInstance;
      gesture: Gesture;
      correct: boolean;
      points: number;
    }
  | { type: 'notificationExpired'; notification: NotificationInstance }
  | { type: 'notificationOverflow' }
  | { type: 'stressOverflow' }
  | { type: 'collision'; obstacle: ObstacleInstance }
  | { type: 'nearMiss'; obstacle: ObstacleInstance; points: number }
  | { type: 'pickup'; obstacle: ObstacleInstance }
  | { type: 'lifeGained' }
  | { type: 'gameOver' };

export interface SimulationOptions {
  /** Invincible (debug). */
  god?: boolean;
}
