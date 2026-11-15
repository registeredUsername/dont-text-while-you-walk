/**
 * Réglages globaux du jeu. Tout ce qui se règle « au ressenti » pendant les playtests vit ici
 * (ou dans les JSON de src/content/data pour ce qui dépend d'une ville).
 *
 * Unités : les distances sont en « unités de jeu » (u), pas en mètres. Elles sont choisies
 * pour que les obstacles mettent 3 à 7 secondes à traverser l'écran.
 */
export const GAME_CONFIG = {
  /** Nombre de couloirs sur le trottoir. */
  lanes: 3,
  startLane: 1,
  /** Pas de simulation fixe (secondes). */
  fixedDt: 1 / 60,
  /** Distance devant le joueur à laquelle les obstacles apparaissent (u). */
  viewDistance: 70,
  /** Calme au démarrage : premier obstacle à cette distance (u). */
  firstObstacleAt: 60,
  /** Délai avant la première notification (s). */
  firstNotificationAfter: 4,

  phone: {
    /** Durée pour lever ou baisser le téléphone (s). */
    transitionSeconds: 0.15,
    /** Nombre maximum de notifications en attente. Au-delà : stress. */
    maxStack: 5,
    /** Une collision fait baisser le téléphone d'un coup. */
    collisionLowersPhone: true,
  },

  player: {
    lives: 3,
    maxLives: 3,
    invulnerableSeconds: 1.5,
    duckSeconds: 0.7,
  },

  stress: {
    max: 10,
    /** Baisse de la jauge par seconde quand la file de notifs est vide. */
    decayPerSecond: 0.5,
    /** Stress ajouté quand une notif arrive alors que la file est pleine. */
    overflowPenalty: 1,
  },

  score: {
    /** Points par unité parcourue. */
    pointsPerUnit: 0.2,
    nearMissBonus: 25,
    /** Fenêtre (s) pour qu'un changement de couloir compte comme un frôlement. */
    nearMissWindow: 0.3,
    /** Seuils de combo et multiplicateurs associés. */
    comboSteps: [0, 5, 15, 30],
    comboMultipliers: [1, 2, 3, 5],
  },

  /** Une vie regagnée toutes les N notifs parfaites d'affilée. */
  healEveryPerfectNotifications: 10,

  /**
   * Reconnaissance des gestes, en pixels du jeu (le jeu fait 720 px de large,
   * mis à l'échelle de l'écran) et en millisecondes.
   */
  gestures: {
    swipeMinDistance: 50,
    swipeMaxDuration: 400,
    tapMaxDistance: 18,
    tapMaxDuration: 250,
    longPressDuration: 450,
  },
};

export type GameConfig = typeof GAME_CONFIG;
