/**
 * Géométrie de l'écran et de la perspective. Le jeu est conçu en 720 × 1280 (portrait)
 * puis mis à l'échelle de l'écran du téléphone (Phaser.Scale.FIT).
 */
export const VIEW = { width: 720, height: 1280 } as const;

export const PERSPECTIVE = {
  /** Plus c'est grand, plus les objets lointains restent gros. */
  depthScale: 8,
  /** Largeur d'un couloir au premier plan (px). */
  laneWidth: 250,
  /** Bord du trottoir, en couloirs depuis le centre. */
  sidewalkHalfWidth: 1.5,
  /** Hauteur de la façade des immeubles, en largeurs de couloir. */
  wallHeight: 7,
} as const;

export const PHONE = {
  width: 560,
  height: 1100,
  /** Haut du téléphone quand il est baissé : on n'en voit qu'un bout en bas. */
  downTop: VIEW.height * 0.82,
  /** Haut du téléphone quand il est levé : il reste une fine bande de rue en haut. */
  upTop: VIEW.height * 0.2,
} as const;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Facteur d'échelle d'un objet à la distance `d` devant le joueur. */
export function depthFactor(d: number): number {
  return 1 / (1 + Math.max(d, -0.9 * PERSPECTIVE.depthScale) / PERSPECTIVE.depthScale);
}

/**
 * Hauteur des yeux, en largeurs de couloir (1 couloir ≈ 1 m).
 * Se baisser fait descendre la caméra, sauter la fait monter : les obstacles à hauteur
 * de tête passent alors au-dessus, ceux au ras du sol en dessous.
 */
export const EYE = {
  standing: 1.6,
  ducking: 0.75,
  /** Hauteur gagnée au sommet du saut. */
  jumpApex: 0.9,
} as const;

/** Profondeur la plus proche dessinée (derrière le joueur), pour couvrir le bas de l'écran. */
export const NEAR_DEPTH = -7;

/**
 * Ligne d'horizon. Quand on lève le téléphone, on baisse la tête : l'horizon monte.
 * Téléphone levé, la bande de rue visible au-dessus du téléphone ne montre que le lointain
 * (au-delà de ~40 u), le reste est caché par le téléphone.
 */
export function horizonY(phoneProgress: number): number {
  return lerp(VIEW.height * 0.34, VIEW.height * 0.148, phoneProgress);
}

export interface Projection {
  horizon: number;
  /** Décalage de caméra en couloirs (suit le couloir du joueur avec un lissage). */
  cameraLane: number;
  /** Hauteur des yeux (largeurs de couloir). */
  eye: number;
}

/** Position verticale à l'écran d'un point à la distance `d` et à la hauteur `height` (couloirs). */
export function projectY(proj: Projection, d: number, height = 0): number {
  return proj.horizon + (proj.eye - height) * PERSPECTIVE.laneWidth * depthFactor(d);
}

/** `offset` = position latérale en couloirs depuis le centre du trottoir (-1, 0, 1 pour les couloirs). */
export function projectX(proj: Projection, offset: number, d: number): number {
  return VIEW.width / 2 + (offset - proj.cameraLane) * PERSPECTIVE.laneWidth * depthFactor(d);
}
